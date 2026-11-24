import { it, expect } from 'vitest';
import { financeMutationSchema } from '@/modules/finance/schemas';
it('rejects zero or negative contribution amounts',()=>{for(const amount of [0,-1])expect(financeMutationSchema.safeParse({entity:'contribution',goal_id:'00000000-0000-4000-8000-000000000001',amount,note:''}).success).toBe(false);});
it('rejects invalid dates instead of silently rolling into next month',()=>{expect(financeMutationSchema.safeParse({entity:'goal',title:'Reserva',target_amount:100,deadline:'2026-02-30'}).success).toBe(false);});
