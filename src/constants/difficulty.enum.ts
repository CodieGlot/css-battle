export enum QuestionDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

export type QuestionDifficultyType = keyof typeof QuestionDifficulty;
