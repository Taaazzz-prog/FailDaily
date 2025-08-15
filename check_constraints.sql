-- Vérifier les contraintes sur activity_logs
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'activity_logs'::regclass;

-- Vérifier les types enum s'ils existent
SELECT typname, enumlabel 
FROM pg_type 
JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid 
WHERE typname LIKE '%event%' OR typname LIKE '%category%'
ORDER BY typname, enumsortorder;
