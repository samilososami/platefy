import type { Locale } from './content';

export const demoCopy = {
  es: {
    title: 'Una voz. Tres personalidades.', subtitle: 'Elige un restaurante y habla con platefy.',
    chooser: 'Elige un restaurante', cuisines: ['Cocina japonesa', 'Cocina vegetal', 'Tapas y mar'],
    stories: ['Japón, a una conversación de distancia.', 'Buena comida. Mejores conversaciones.', 'Tapas, mar y buenas conversaciones.'],
    swipe: 'Desliza para cambiar', previous: 'Restaurante anterior', next: 'Siguiente restaurante',
    loading: 'Preparando tu mesa…', error: 'No se ha podido abrir el chat.', retry: 'Volver a intentar',
    recommend: 'Recomiéndame algo', menu: 'Ver la carta', newChat: 'Nuevo chat',
    prompt: '¿Qué me recomiendas por menos de 15 euros?',
    chatSubtitle: 'Pregunta por la carta, los ingredientes o los precios.', placeholder: 'Escribe tu pregunta…',
  },
  en: {
    title: 'One voice. Three personalities.', subtitle: 'Choose a restaurant and talk to platefy.',
    chooser: 'Choose a restaurant', cuisines: ['Japanese cuisine', 'Plant-based cuisine', 'Tapas & seafood'],
    stories: ['Japan, one conversation away.', 'Good food. Better conversations.', 'Tapas, the sea and good conversation.'],
    swipe: 'Swipe to switch', previous: 'Previous restaurant', next: 'Next restaurant',
    loading: 'Preparing your table…', error: 'The chat could not be opened.', retry: 'Try again',
    recommend: 'Recommend something', menu: 'View the menu', newChat: 'New chat',
    prompt: 'What would you recommend for less than 15 euros?',
    chatSubtitle: 'Ask about the menu, ingredients or prices.', placeholder: 'Write your question…',
  },
  ca: {
    title: 'Una veu. Tres personalitats.', subtitle: 'Tria un restaurant i parla amb platefy.',
    chooser: 'Tria un restaurant', cuisines: ['Cuina japonesa', 'Cuina vegetal', 'Tapes i mar'],
    stories: ['El Japó, a una conversa de distància.', 'Bon menjar. Millors converses.', 'Tapes, mar i bones converses.'],
    swipe: 'Llisca per canviar', previous: 'Restaurant anterior', next: 'Restaurant següent',
    loading: 'Preparant la teva taula…', error: 'No s’ha pogut obrir el xat.', retry: 'Torna-ho a provar',
    recommend: 'Recomana’m alguna cosa', menu: 'Veure la carta', newChat: 'Nou xat',
    prompt: 'Què em recomanes per menys de 15 euros?',
    chatSubtitle: 'Pregunta per la carta, els ingredients o els preus.', placeholder: 'Escriu la teva pregunta…',
  },
} satisfies Record<Locale, object>;
