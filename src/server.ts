//we will update it later, its for testing only
import { Server } from 'http';
import app from './app'
const port = 5000;

let server: Server

async function main() {
    server = app.listen(port, () => {
        console.log(`Server is listening on port ${port}`)
    })
}

main()  