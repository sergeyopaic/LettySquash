export const GRADE_RANKS: Record<string, number> = {
  A1: 100,
  A2: 90,
  B1: 80,
  B2: 70,
  C1: 60,
  C2: 50,
  D1: 40,
  D2: 30,
  E1: 20,
  E2: 10,
  F: 5,
  J1: 4,
  J2: 3,
  J3: 2,
  J4: 1,
};

export const getGradeRank = (grade: string): number => {
  return GRADE_RANKS[grade] || 50;
};
