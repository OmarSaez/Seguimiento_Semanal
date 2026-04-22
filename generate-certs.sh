#!/bin/bash

# Crear carpeta de certificados si no existe
mkdir -p certs

# Generar certificado auto-firmado
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/C=CL/ST=RM/L=Santiago/O=SeguimientoSemanal/OU=IT/CN=localhost"

echo "Certificados generados en la carpeta ./certs"
