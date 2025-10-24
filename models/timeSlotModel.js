import mongoose from "mongoose";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeSlotSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Teacher",
            index: true,
        },
        dayOfWeek: {
            type: String,
            required: true,
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            lowercase: true,
            index: true,
        },
        // Human-readable times, enforced to HH:mm
        startTime: {
            type: String,
            required: true,
            match: HHMM,
        },
        endTime: {
            type: String,
            required: true,
            match: HHMM,
        },
        // Numeric minutes since midnight to make conflict checks easy & fast
        startMinutes: {
            type: Number,
            min: 0,
            max: 24 * 60 - 1,
            index: true,
        },
        endMinutes: {
            type: Number,
            min: 1,
            max: 24 * 60,
            index: true,
        },
        isBooked: {
            type: Boolean,
            default: false,
        },
        studentsNumber: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

// Helpful compound index (speeds up overlap lookups)
timeSlotSchema.index({
    teacher: 1,
    dayOfWeek: 1,
    startMinutes: 1,
    endMinutes: 1,
});

const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);
export default TimeSlot;