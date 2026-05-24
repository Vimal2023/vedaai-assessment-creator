import { Schema, model, Document } from 'mongoose';

export interface IAssessment extends Document {
  title: string;
  description?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
  totalMarks: number;
  status: 'pending' | 'completed' | 'failed'; // Used to track BullMQ progress
  questions: Schema.Types.ObjectId[]; // <-- 1. Add this to your TypeScript Interface
  createdAt: Date;
  updatedAt: Date;
  passingPercentage?: number;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    description: { type: String },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    timeLimit: { type: Number, required: true, default: 60 },
    passingPercentage: {
    type: Number,
    default: 40, // Falls back to standard 40% if not explicitly defined by the teacher
    },
    totalMarks: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    // <-- 2. Add this to your Schema definition to establish the relation link
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }], 
  },
  { timestamps: true }
);

export const Assessment = model<IAssessment>('Assessment', AssessmentSchema);