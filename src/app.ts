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