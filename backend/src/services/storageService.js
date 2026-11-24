const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const driver = (process.env.STORAGE_DRIVER || 'gcs').toLowerCase();
const projectId = process.env.GCS_PROJECT_ID;
const bucketName = process.env.GCS_BUCKET_NAME || 'tecflix-media-storage';
const keyFilePath = process.env.GCS_KEY_FILE ? path.resolve(process.env.GCS_KEY_FILE) : null;

let storageClient = null;
let bucket = null;
let isGcsReady = false;

// Inicialización de Google Cloud Storage
if (keyFilePath && fs.existsSync(keyFilePath)) {
  try {
    storageClient = new Storage({
      projectId: projectId || undefined,
      keyFilename: keyFilePath,
    });
    bucket = storageClient.bucket(bucketName);
    isGcsReady = true;
    console.log(`[Google Cloud Storage] Conectado exitosamente al bucket: ${bucketName}`);
  } catch (err) {
    console.warn(`[GCS Advertencia] No se pudo inicializar cliente GCS (${err.message}).`);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  try {
    storageClient = new Storage({ projectId: projectId || undefined });
    bucket = storageClient.bucket(bucketName);
    isGcsReady = true;
    console.log(`[Google Cloud Storage] Conectado usando GOOGLE_APPLICATION_CREDENTIALS.`);
  } catch (err) {
    console.warn(`[GCS Advertencia] No se pudo inicializar cliente GCS: ${err.message}`);
  }
} else {
  console.log(`[GCS Info] No se detectó archivo de clave de cuenta de servicio de Google Cloud Storage en GCS_KEY_FILE.`);
  console.log(`[GCS Info] El backend operará en modo híbrido: almacenamiento local con emulación de endpoints GCS y soporte listo para cuando se configure la clave.`);
}

/**
 * Sube un archivo a Google Cloud Storage o al almacenamiento local de respaldo.
 * @param {Object} file Objeto de archivo provisto por Multer
 * @param {'videos' | 'thumbnails'} folder Carpeta de destino
 * @returns {Promise<{ url: string, storageType: string, bucket: string|null, objectKey: string, size: number }>}
 */
async function uploadFile(file, folder = 'videos') {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${folder}/${Date.now()}-${uuidv4().substring(0, 8)}-${cleanOriginalName}`;

  // Si Google Cloud Storage está configurado y disponible
  if (isGcsReady && bucket) {
    try {
      const gcsFile = bucket.file(uniqueName);
      const stream = gcsFile.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: 'TECFLIX-Creator-Studio',
            originalName: file.originalname,
          }
        },
        resumable: false,
      });

      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        if (file.buffer) {
          stream.end(file.buffer);
        } else if (file.path) {
          fs.createReadStream(file.path).pipe(stream);
        } else {
          reject(new Error('Archivo sin contenido buffer ni path.'));
        }
      });

      // Si el bucket es público o queremos URL directa de GCS
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueName}`;

      console.log(`[GCS Exitoso] Archivo subido a Google Cloud Storage: ${publicUrl}`);

      return {
        url: publicUrl,
        storageType: 'gcs',
        bucket: bucketName,
        objectKey: uniqueName,
        size: file.size || (file.buffer ? file.buffer.length : 0),
        originalName: file.originalname,
      };
    } catch (gcsError) {
      console.warn(`[GCS Error al subir, aplicando fallback local] ${gcsError.message}`);
    }
  }

  // Fallback Local de alta velocidad (soporta HTTP Range Requests para reproducción)
  const targetDir = path.resolve(__dirname, `../../uploads/${folder}`);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const localFileName = `${Date.now()}-${uuidv4().substring(0, 8)}-${cleanOriginalName}`;
  const localFilePath = path.join(targetDir, localFileName);

  if (file.buffer) {
    fs.writeFileSync(localFilePath, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, localFilePath);
    try { fs.unlinkSync(file.path); } catch (_) {}
  }

  const port = process.env.PORT || 5000;
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  const localUrl = `${baseUrl}/uploads/${folder}/${localFileName}`;

  console.log(`[Almacenamiento Local] Archivo guardado localmente: ${localUrl}`);

  return {
    url: localUrl,
    storageType: 'local',
    bucket: null,
    objectKey: `local://${folder}/${localFileName}`,
    size: file.size || 0,
    originalName: file.originalname,
  };
}

module.exports = {
  uploadFile,
  isGcsReady: () => isGcsReady,
  getBucketName: () => bucketName,
};
