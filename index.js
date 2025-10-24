import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import teacherRoutes from './routes/teachers.routes.js';
import appointmentRoutes from './routes/appointments.routes.js';
import authRoutes from './routes/auth.routes.js';
import slotRouter from "./routes/slots.routes.js"
import studentRoutes from "./routes/students.routes.js"
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import makaleRoutes from "./routes/makaleler.routes.js";
import publicationsRoutes from "./routes/publications.routes.js";
import contentRoutes from "./routes/content.routes.js"
import usersRoutes from "./routes/users.routes.js"
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true,
}));

// Routes
app.use('/api/teachers', teacherRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/teachers", slotRouter)
app.use("/api/students", studentRoutes)
app.use("/api/makaleler", makaleRoutes);
app.use("/api/publications", publicationsRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/users", usersRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});