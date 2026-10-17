## Feedback format
The /api/feedback route always returns JSON in this exact shape:

{
  "mistakes": [
    {
      "original": "Yesterday I go to school",
      "fix": "Yesterday I went to school",
      "rule": "past-simple",
      "why": "Use past simple for finished actions."
    }
  ],
  "summary": "Clear ideas! Watch your past tense."
}

The "rule" value must match a lesson id in data/lessons.json, or be "other".