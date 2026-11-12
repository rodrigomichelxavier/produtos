// Coordenadas APROXIMADAS dos municípios e de alguns bairros (somente para o protótipo).

export const CENTROS: Record<string, [number, number]> = {
  Campinas: [-22.9056, -47.0608],
  "Artur Nogueira": [-22.5731, -47.1725],
  Cosmópolis: [-22.6458, -47.1961],
  Holambra: [-22.6331, -47.0561],
  Hortolândia: [-22.8583, -47.22],
  Indaiatuba: [-23.0903, -47.2181],
  Jaguariúna: [-22.7056, -46.9858],
  "Monte Mor": [-22.9467, -47.3158],
  Paulínia: [-22.7614, -47.1543],
  "Santo Antônio de Posse": [-22.6061, -46.9192],
  Sumaré: [-22.8219, -47.2669],
  Valinhos: [-22.9706, -46.9958],
  Vinhedo: [-23.0297, -46.975],
};

const BAIRROS: Record<string, [number, number]> = {
  "Campinas|Cambuí": [-22.8936, -47.0503],
  "Campinas|Centro": [-22.9064, -47.0616],
  "Campinas|Taquaral": [-22.8726, -47.0525],
  "Campinas|Nova Campinas": [-22.8995, -47.04],
  "Campinas|Barão Geraldo": [-22.8236, -47.0794],
  "Campinas|Guanabara": [-22.8885, -47.071],
  "Campinas|Castelo": [-22.885, -47.078],
  "Campinas|Bosque": [-22.912, -47.054],
  "Campinas|Swift": [-22.923, -47.062],
  "Campinas|Ponte Preta": [-22.919, -47.058],
  "Campinas|Cambuí II": [-22.8905, -47.0465],
  "Campinas|Jardim Proença": [-22.9165, -47.0435],
  "Campinas|Sousas": [-22.8829, -46.9706],
  "Sumaré|Centro": [-22.8219, -47.2669],
  "Sumaré|Nova Veneza": [-22.846, -47.228],
  "Hortolândia|Jardim Amanda": [-22.853, -47.23],
  "Hortolândia|Remanso Campineiro": [-22.865, -47.199],
  "Indaiatuba|Centro": [-23.0903, -47.2181],
  "Indaiatuba|Cidade Nova": [-23.08, -47.21],
  "Valinhos|Centro": [-22.9706, -46.9958],
  "Valinhos|Jardim Planalto": [-22.96, -46.98],
  "Paulínia|Centro": [-22.7614, -47.1543],
  "Paulínia|Morumbi": [-22.77, -47.145],
};

/** Coordenada de um bairro conhecido ou, se não houver, o centro da cidade com um pequeno deslocamento estável. */
export function coordenadas(cidade: string, bairro: string): [number, number] {
  const conhecido = BAIRROS[`${cidade}|${bairro}`];
  if (conhecido) return conhecido;
  const c = CENTROS[cidade] ?? CENTROS.Campinas;
  let h = 0;
  for (const ch of `${cidade}${bairro}`) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const dx = ((h & 0xff) / 255 - 0.5) * 0.03;
  const dy = (((h >> 8) & 0xff) / 255 - 0.5) * 0.03;
  return [c[0] + dy, c[1] + dx];
}

/** Desloca levemente (≈150–350 m) um ponto, de forma estável, para que prestadores do mesmo bairro não se sobreponham. */
export function espalhar([lat, lng]: [number, number], semente: string): [number, number] {
  let h = 7;
  for (const ch of semente) h = (h * 33 + ch.charCodeAt(0)) | 0;
  const ang = ((h >>> 0) % 360) * (Math.PI / 180);
  const raio = 0.0015 + (((h >>> 9) % 100) / 100) * 0.002;
  return [lat + Math.sin(ang) * raio, lng + Math.cos(ang) * raio];
}
