#!/usr/bin/env node
const { spawn } = require('child_process');

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = process.env.DB_PASSWORD,
  DB_NAME = 'faildaily'
} = process.env;

const sqlPath = require('path').join(__dirname, '..', 'migrations', 'faildaily.sql');

console.log(`Importing SQL: ${sqlPath}`);
const args = [
  '-h', DB_HOST,
  '-P', DB_PORT,
  '-u', DB_USER,
  `-p${DB_PASSWORD}`,
  DB_NAME
];

const mysql = spawn('mysql', args, { stdio: ['pipe', 'inherit', 'inherit'] });
const fs = require('fs');
const read = fs.createReadStream(sqlPath);
read.pipe(mysql.stdin);

mysql.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Database import completed');
  } else {
    console.error('❌ Database import failed with code', code);
    process.exit(code);
  }
});

