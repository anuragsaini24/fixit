import mongoose from 'mongoose';
import { modelOptions } from './modelOptions.js';

const agentSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 1200 },
    createdAt: { type: Date, default: Date.now },
  }],
  detectedProblem: {
    category: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
  },
  detectedService: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  collectedInformation: { type: Map, of: String, default: {} },
  proposedProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  proposedDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  proposedTime: { type: String, trim: true, maxlength: 40 },
  estimatedCost: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
  },
  state: {
    type: String,
    enum: ['collecting_information', 'analyzing', 'searching_providers', 'recommendation_ready', 'awaiting_approval', 'booking_confirmed', 'completed', 'cancelled', 'expired'],
    default: 'collecting_information',
    required: true,
  },
  expiresAt: { type: Date, required: true, expires: 0 },
}, modelOptions);

agentSessionSchema.index({ user: 1, createdAt: -1 });

export const AgentSession = mongoose.model('AgentSession', agentSessionSchema);