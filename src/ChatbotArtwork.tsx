import type { RestaurantSlug } from './services/restaurant';

export function chatbotArtwork(restaurant: RestaurantSlug, name: 'foliage' | 'garden' | 'orb') {
  return `/restaurantes/${restaurant}/chat-assets/${name}.webp`;
}

/** Decorative artwork stays outside the reading and interaction layers. */
export function ChatbotScenery({ restaurant }: { restaurant: RestaurantSlug }) {
  return <div className="chat-scenery" aria-hidden="true">
    <img className="chat-scenery-branch" src={chatbotArtwork(restaurant, 'foliage')} alt="" width="1024" height="1024" draggable="false" />
    <img className="chat-scenery-sprig" src={chatbotArtwork(restaurant, 'foliage')} alt="" width="1024" height="1024" draggable="false" />
    <img className="chat-scenery-garden" src={chatbotArtwork(restaurant, 'garden')} alt="" width="1024" height="1024" draggable="false" />
  </div>;
}

export function ChatbotGarden({ restaurant }: { restaurant: RestaurantSlug }) {
  return <div className="chat-rail-garden" aria-hidden="true">
    <img src={chatbotArtwork(restaurant, 'garden')} alt="" width="1024" height="1024" draggable="false" />
  </div>;
}
