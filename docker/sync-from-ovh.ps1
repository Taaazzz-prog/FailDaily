# ====================================================================
# 🔄 Script de synchronisation des données OVH vers local
# ====================================================================
# Ce script permet de récupérer les données de votre serveur OVH
# et les importer dans votre environnement Docker local
# ====================================================================

param(
    [string]$ServerHost = "",
    [string]$ServerUser = "",
    [string]$SshKey = "",
    [switch]$Help,
    [switch]$StructureOnly,
    [switch]$FullData
)

if ($Help -or $ServerHost -eq "" -or $ServerUser -eq "") {
    Write-Host "🔄 Script de synchronisation FailDaily OVH → Local" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\sync-from-ovh.ps1 -ServerHost 'votre.serveur.ovh' -ServerUser 'username' [-SshKey 'path/to/key']"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -ServerHost      : Adresse IP ou domaine de votre serveur OVH"
    Write-Host "  -ServerUser      : Nom d'utilisateur SSH"
    Write-Host "  -SshKey          : Chemin vers votre clé SSH privée (optionnel)"
    Write-Host "  -StructureOnly   : Importer seulement la structure (pas de données)"
    Write-Host "  -FullData        : Importer structure + toutes les données"
    Write-Host "  -Help            : Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\sync-from-ovh.ps1 -ServerHost '51.68.45.123' -ServerUser 'root' -FullData"
    Write-Host "  .\sync-from-ovh.ps1 -ServerHost 'faildaily.com' -ServerUser 'ubuntu' -SshKey '~/.ssh/id_rsa' -StructureOnly"
    exit 0
}

Write-Host "🔄 Synchronisation FailDaily OVH → Local" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Vérifier que SSH est disponible
try {
    ssh -V 2>$null | Out-Null
    Write-Host "✅ SSH détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH n'est pas disponible" -ForegroundColor Red
    Write-Host "Sur Windows, installez OpenSSH ou utilisez WSL" -ForegroundColor Yellow
    exit 1
}

# Vérifier que Docker est en cours d'exécution
try {
    docker ps 2>$null | Out-Null
    Write-Host "✅ Docker en cours d'exécution" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "Lancez d'abord: .\start-local.ps1" -ForegroundColor Yellow
    exit 1
}

# Construire la commande SSH
$sshCommand = "ssh"
if ($SshKey -ne "") {
    $sshCommand += " -i `"$SshKey`""
}
$sshCommand += " $ServerUser@$ServerHost"

Write-Host "🔗 Connexion au serveur: $ServerUser@$ServerHost" -ForegroundColor Blue

# Test de connexion SSH
Write-Host "🧪 Test de connexion SSH..." -ForegroundColor Yellow
$testConnection = Invoke-Expression "$sshCommand 'echo SSH_OK'" 2>$null
if ($testConnection -ne "SSH_OK") {
    Write-Host "❌ Impossible de se connecter au serveur" -ForegroundColor Red
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "  - L'adresse du serveur: $ServerHost" -ForegroundColor Gray
    Write-Host "  - Le nom d'utilisateur: $ServerUser" -ForegroundColor Gray
    Write-Host "  - Votre clé SSH ou mot de passe" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ Connexion SSH établie" -ForegroundColor Green

# Créer un nom de fichier unique pour le dump
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFileName = "faildaily_dump_$timestamp.sql"
$localDumpPath = ".\$dumpFileName"

Write-Host ""
Write-Host "📊 Création du dump de base de données sur le serveur..." -ForegroundColor Cyan

# Déterminer le type de dump
$dumpOptions = ""
if ($StructureOnly) {
    $dumpOptions = "--no-data"
    Write-Host "📋 Mode: Structure seulement" -ForegroundColor Blue
} elseif ($FullData) {
    $dumpOptions = "--single-transaction --routines --triggers"
    Write-Host "📦 Mode: Données complètes" -ForegroundColor Blue
} else {
    $dumpOptions = "--single-transaction"
    Write-Host "⚖️  Mode: Structure + données essentielles" -ForegroundColor Blue
}

# Créer le dump sur le serveur
$createDumpCommand = @"
# Trouver le conteneur MySQL
MYSQL_CONTAINER=`$(docker ps --format 'table {{.Names}}' | grep -E '(mysql|db|faildaily.*db)' | head -1)
if [ -z "`$MYSQL_CONTAINER" ]; then
    echo "ERROR: Conteneur MySQL non trouvé"
    exit 1
fi

echo "Conteneur MySQL trouvé: `$MYSQL_CONTAINER"

# Créer le dump
docker exec `$MYSQL_CONTAINER mysqldump -u root -p\`$DB_ROOT_PASSWORD\` $dumpOptions faildaily > /tmp/$dumpFileName

# Vérifier que le dump a été créé
if [ -f "/tmp/$dumpFileName" ]; then
    echo "SUCCESS: Dump créé - `$(wc -l < /tmp/$dumpFileName) lignes"
else
    echo "ERROR: Échec de création du dump"
    exit 1
fi
"@

Write-Host "🔨 Exécution de la commande de dump..." -ForegroundColor Yellow
$dumpResult = Invoke-Expression "$sshCommand '$createDumpCommand'"

if ($dumpResult -like "*ERROR:*") {
    Write-Host "❌ Erreur lors de la création du dump:" -ForegroundColor Red
    Write-Host $dumpResult -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dump créé sur le serveur" -ForegroundColor Green
Write-Host $dumpResult -ForegroundColor Gray

# Télécharger le dump
Write-Host ""
Write-Host "⬇️  Téléchargement du dump..." -ForegroundColor Cyan

$scpCommand = "scp"
if ($SshKey -ne "") {
    $scpCommand += " -i `"$SshKey`""
}
$scpCommand += " $ServerUser@$ServerHost:/tmp/$dumpFileName `"$localDumpPath`""

try {
    Invoke-Expression $scpCommand
    Write-Host "✅ Dump téléchargé: $localDumpPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du téléchargement" -ForegroundColor Red
    exit 1
}

# Nettoyer le serveur
Write-Host "🧹 Nettoyage du serveur..." -ForegroundColor Yellow
Invoke-Expression "$sshCommand 'rm /tmp/$dumpFileName'"

# Vérifier que le conteneur MySQL local est prêt
Write-Host ""
Write-Host "🔍 Vérification du MySQL local..." -ForegroundColor Cyan
$mysqlCheck = docker exec faildaily_db mysqladmin ping -h localhost -u root -pfaildaily_root_password 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ MySQL local non disponible" -ForegroundColor Red
    Write-Host "Lancez d'abord: .\start-local.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ MySQL local prêt" -ForegroundColor Green

# Importer le dump dans MySQL local
Write-Host ""
Write-Host "📥 Import dans la base de données locale..." -ForegroundColor Cyan

# Copier le dump dans le conteneur
docker cp $localDumpPath faildaily_db:/tmp/import.sql

# Importer
docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily -e "source /tmp/import.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Import réussi!" -ForegroundColor Green
    
    # Nettoyer
    docker exec faildaily_db rm /tmp/import.sql
    Remove-Item $localDumpPath -Force
    
    # Afficher des statistiques
    Write-Host ""
    Write-Host "📊 Statistiques de la base importée:" -ForegroundColor Cyan
    
    $stats = docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily -e "
    SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL
    SELECT 'profiles', COUNT(*) FROM profiles UNION ALL  
    SELECT 'fails', COUNT(*) FROM fails UNION ALL
    SELECT 'badges', COUNT(*) FROM badges UNION ALL
    SELECT 'reactions', COUNT(*) FROM reactions;
    " 2>$null
    
    Write-Host $stats -ForegroundColor White
    
} else {
    Write-Host "❌ Erreur lors de l'import" -ForegroundColor Red
    Write-Host "Le fichier dump est conservé: $localDumpPath" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Synchronisation terminée avec succès!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host "🌐 Votre application locale utilise maintenant les données du serveur OVH" -ForegroundColor White
Write-Host "🔗 Accès: http://localhost:8080" -ForegroundColor White

Write-Host ""
Write-Host "💡 Commandes utiles:" -ForegroundColor Cyan  
Write-Host "  docker-compose restart backend    # Redémarrer le backend" -ForegroundColor Gray
Write-Host "  docker exec -it faildaily_db mysql -u faildaily_user -pfaildaily_password faildaily" -ForegroundColor Gray
