export async function loadAssets() {
  const entries = await Promise.all(['terrain','keep','house','farm','lumber','tree','rock'].map(async name => {
    const image = new Image();
    image.src = `assets/runtime/${name}.webp`;
    await image.decode();
    return [name,image];
  }));
  return Object.fromEntries(entries);
}
