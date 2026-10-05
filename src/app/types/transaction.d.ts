export type Transaction = {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    user_id: string | null;
    embedding: number[] | null;
}
