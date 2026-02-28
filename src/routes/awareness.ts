import express from 'express';
import db from '../db/database.ts';

const router = express.Router();

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Which of these is NOT biodegradable?",
    options: ["Banana peel", "Paper bag", "Plastic bottle", "Cotton cloth"],
    answer: "Plastic bottle"
  },
  {
    id: 2,
    question: "What is the primary goal of source segregation?",
    options: ["To make waste look better", "To facilitate recycling and composting", "To increase landfill size", "To reduce collection frequency"],
    answer: "To facilitate recycling and composting"
  },
  {
    id: 3,
    question: "Which color bin is used for dry waste in Madurai?",
    options: ["Green", "Blue", "Red", "Yellow"],
    answer: "Blue"
  }
];

router.get('/quiz', (req, res) => {
  res.json(QUIZ_QUESTIONS);
});

router.get('/tips', (req, res) => {
  res.json([
    { title: "Home Composting", content: "Use a small bin for kitchen waste. Layer with dry leaves or coco peat." },
    { title: "Reduce Plastic", content: "Carry your own cloth bag when visiting markets like Simmakkal." },
    { title: "E-Waste Disposal", content: "Don't throw batteries in regular trash. Use designated collection points." }
  ]);
});

export default router;
