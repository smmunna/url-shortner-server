import express from 'express'
import cors from 'cors'
import helmet from 'helmet';
import router from './app/routes';
const app = express()

app.use(express.json());
app.use(cors());

// Helmet for Security purpose, hiding the 'Express' server name from Header
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

const allowedDomains = ['http://localhost:5173', 'http://url.techzaint.com', 'https://url.techzaint.com']; // Default to an empty array if not defined

// CORS middleware
const corsConfig = cors({
    origin: (origin: string | undefined, callback: Function) => {
        if (allowedDomains.includes(origin!) || !origin) {
            callback(null, true); // Allow if the origin is in the allowed list or if there's no origin (e.g., Postman)
        } else {
            callback(new Error('Unauthorized: You do not have correct domain access.'));
        }
    },
    credentials: true, // Enable if you want to allow cookies with the requests
});

app.use(corsConfig);


app.use('/api/v1', router); //Main routes

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the API!',
        developer: 'Minhazul Abedin Munna',
        timestamp: Date.now()
    })
})

// Route Error for any  url not found .
app.all('*', (req, res) => {
    res.status(404).json({
        status: 404,
        message: 'Not Found',
    });
});

// Global Error Handler
app.use((error: any, res) => {
    if (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
});

export default app