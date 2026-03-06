import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Setup CORS so React frontend can freely talk to this backend locally
app.use(cors());

// Serve images statically from the backend to ensure visibility during development
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'public', 'images', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'guest-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API to handle upload
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    // Determine the base URL dynamically based on the incoming request
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/images/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, message: 'File uploaded successfully' });
});

// API to list uploaded images
app.get('/api/images', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading upload directory', err);
            return res.status(500).json({ error: 'Failed to read images' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Filter out non-image files if necessary, and map to URLs
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => `${baseUrl}/images/uploads/${file}`);

        res.json(images);
    });
});

// API to delete an uploaded image
app.delete('/api/images/:filename', (req, res) => {
    const filename = req.params.filename;

    // basic security check to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid file name.' });
    }

    const filePath = path.join(uploadDir, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Delete error', err);
            // If file doesn't exist, we might still want to return success to client
            // doing idempotent deletes, but let's just return 500 for simplicity or 404
            return res.status(500).json({ error: 'Failed to delete file.' });
        }
        res.json({ message: 'File deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Upload API server running on http://localhost:${PORT}`);
});
