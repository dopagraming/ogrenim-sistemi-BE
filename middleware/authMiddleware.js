import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Teacher from '../models/teacherModel.js';
import MasterStudent from '../models/masterStudentModel.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.teacher = await Teacher.findById(decoded.id).select('-password');

            if (!req.teacher) {
                res.status(401);
                throw new Error('Not authorized, teacher not found');
            }
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const protectStudent = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.student = await MasterStudent.findById(decoded.id).select('-password');

            if (!req.student) {
                res.status(401);
                throw new Error('Not authorized, student not found');
            }

            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

export { protect, protectStudent };
