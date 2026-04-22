import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Mental Resilience",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been feeling optimistic about the future",
    options: [
      { label: "None of the time", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "All of the time", value: 5 },
    ]
  },
  {
    id: 2,
    category: "Mental Resilience",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been feeling useful",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtE6lIm09ktQJ7tSwMe5rhLp6P9E0ozZ2esxNPDP7EHiinseq2c5q3ZtNAGN6Rl0SrR3dTM0GWWO1ERZeFhI3rA2uNDde5YhlweL4Qw_MHxsr1Z2cQnLWeouHlHYglgrK6kXxyivNc_H1lQoe85tdHSRu4Ey6ztkYA2mvWqEmSsZ2UqoRFznWrfHz1Dbyv5ID4HPwuWM2i6YKrQLQlm1-o_4HioBXNIe72zhKNknpsmvdTpcyaEPo-XMzlZeNCgaWPiqnvgfY5Ric",
    hint: "Mental resilience drives physical peaks",
    options: [
      { label: "None of the time", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "All of the time", value: 5 },
    ]
  },
  {
    id: 3,
    category: "Mental Resilience",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been feeling relaxed",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuApVC37B-74FtRilX5-7j61kmExeKstNs6oo048ZcASKgp4-pinoDCwToTkcRHWCm3W7tPv_7tetkEP8K1_cmXP-hqn_j0taap4U9GAy4siDAQcAShjayKH-PgedCQL52OSf4BbKNX_dZpKgw1MLHZwvxNPY-KmGLce6DCmGE9sahDS1J3dxLrcupWqaHljk--2PKvZ1P9zkbTWHUUqj1iYdA4wl9cF2LT7pYOQ_7iLQnEHZzd8ncLX4rxnu0Wgmv78VcnJxGfCDNw",
    options: [
      { label: "Not at all", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "All of the time", value: 5 },
    ]
  },
  {
    id: 4,
    category: "Mental Resilience",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been dealing with problems well",
    options: [
      { label: "Not at all", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "All of the time", value: 5 },
    ]
  },
  {
    id: 5,
    category: "Mental Resilience",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been thinking clearly",
    hint: "Mental clarity is the engine of peak performance. Be honest with your pace today.",
    options: [
      { label: "None of the time", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "All of the time", value: 5 },
    ]
  },
  {
    id: 6,
    category: "Social Assessment",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been able to connect with other people comfortably",
    options: [
      { label: "Not at all", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "Very Often", value: 5 },
    ]
  },
  {
    id: 7,
    category: "Assessment Period",
    text: "Over the last 2 weeks, how often have you felt like this?",
    highlight: "I've been able to make up my own mind about things",
    options: [
      { label: "None of the time", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Some of the time", value: 3 },
      { label: "Often", value: 4 },
      { label: "All of the time", value: 5 },
    ]
  },
  {
    id: 8,
    category: "Confidence / Growth",
    text: "How do you rate yourself in this sport now?",
    hint: "Rate your current level after the tournament.",
    inputType: "number",
    min: 1,
    max: 10,
  },
  {
    id: 9,
    category: "Confidence / Growth",
    text: "Compared to before the tournament, my confidence has:",
    options: [
      { label: "Decreased", value: 1 },
      { label: "Same", value: 2 },
      { label: "Improved Slightly", value: 3 },
      { label: "Improved A Lot", value: 4 },
    ]
  },
  {
    id: 10,
    category: "Confidence / Growth",
    text: "I now feel more comfortable competing with others",
    options: [
      { label: "Strongly Disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "Neutral", value: 3 },
      { label: "Agree", value: 4 },
      { label: "Strongly Agree", value: 5 },
    ]
  },
  {
    id: 11,
    category: "Physical",
    text: "Since participating, I feel more motivated to stay active",
    options: [
      { label: "Strongly Disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "Neutral", value: 3 },
      { label: "Agree", value: 4 },
      { label: "Strongly Agree", value: 5 },
    ]
  },
  {
    id: 12,
    category: "Physical",
    text: "The tournament pushed me to give my physical best",
    options: [
      { label: "Strongly Disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "Neutral", value: 3 },
      { label: "Agree", value: 4 },
      { label: "Strongly Agree", value: 5 },
    ]
  },
  {
    id: 13,
    category: "Social",
    text: "I made new friends/connections through this tournament",
    options: [
      { label: "Yes", value: 3 },
      { label: "Somewhat", value: 2 },
      { label: "No", value: 1 },
    ]
  },
  {
    id: 14,
    category: "Social",
    text: "I feel more confident in group environments now",
    options: [
      { label: "Strongly Disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "Neutral", value: 3 },
      { label: "Agree", value: 4 },
      { label: "Strongly Agree", value: 5 },
    ]
  },
  {
    id: 15,
    category: "Experience",
    text: "Overall tournament experience",
    inputType: "number",
    min: 1,
    max: 10,
  },
  {
    id: 16,
    category: "Experience",
    text: "Biggest takeaway from the tournament",
    inputType: "text",
    inputPlaceholder: "Share your biggest takeaway..."
  },
  {
    id: 17,
    category: "Future Intent",
    text: "Would you participate in future Ziva tournaments?",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "Maybe", value: "Maybe" },
      { label: "No", value: "No" },
    ]
  },
  {
    id: 18,
    category: "Future Intent",
    text: "Would you like personal stats/reports in future?",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "Maybe", value: "Maybe" },
      { label: "No", value: "No" },
    ]
  }
];
