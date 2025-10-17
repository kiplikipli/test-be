export const MessagePatterns = {
  AUTH: {
    VALIDATE: 'AUTH.VALIDATE',
  },
  ATTENDANCE: {
    QUERY_BY_PERSON: 'ATTENDANCE.QUERY_BY_PERSON',
  },
  EMPLOYEE: {
    GET_BY_ID: 'EMPLOYEE.GET_BY_ID',
  },
} as const;

export type MessagePatternValue =
  (typeof MessagePatterns)[keyof typeof MessagePatterns][keyof (typeof MessagePatterns)[keyof typeof MessagePatterns]];
