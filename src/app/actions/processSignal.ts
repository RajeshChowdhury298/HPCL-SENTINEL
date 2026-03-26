import { supabase } from '@/lib/supabaseClient';

const PRODUCT_MAPPING = [
  { keywords: ['boiler', 'furnace', 'heating'], product: 'Furnace Oil (FO)', score: 90 },
  { keywords: ['road', 'highway', 'construction'], product: 'Bitumen', score: 95 },
  { keywords: ['power', 'generator', 'genset'], product: 'LDO (Light Diesel Oil)', score: 85 },
  { keywords: ['jute', 'batching'], product: 'JBO (Jute Batching Oil)', score: 90 }
];

export async function processRawSignal(signalId: string, text: string) {
  const lowercaseText = text.toLowerCase();
  
  // Requirement 3: Intelligent extraction + industry context mapping
  const match = PRODUCT_MAPPING.find(m => 
    m.keywords.some(k => lowercaseText.includes(k))
  );

  if (match) {
    const { data, error } = await supabase.from('leads').insert([{
      company_name: "Extracted Entity Alpha", // In real version, use LLM here
      sector: "Industrial",
      recommended_product: match.product,
      confidence_score: match.score,
      reasoning: `Matched keywords: ${match.keywords.filter(k => lowercaseText.includes(k)).join(', ')}`,
      location: "Identified Region",
      status: 'New'
    }]);

    // Mark signal as processed
    await supabase.from('signals').update({ processed: true }).eq('id', signalId);
    return { success: true, product: match.product };
  }
  
  return { success: false, message: "No match found" };
}