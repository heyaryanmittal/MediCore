import React, { createContext, useContext, useReducer } from 'react';
import api from '../services/api';

const ChatbotContext = createContext();

const chatbotReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_CHATBOT':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
};

export const ChatbotProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatbotReducer, initialState);

  const toggleChatbot = () => {
    dispatch({ type: 'TOGGLE_CHATBOT' });
  };

  const sendMessage = async (message) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Add user message
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'user',
          content: message,
          timestamp: new Date(),
        },
      });

      const response = await api.post('/chatbot/chat', { message });

      if (response.data.success) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            type: 'bot',
            content: response.data.data.response,
            timestamp: new Date(),
            isHealthRelated: response.data.data.isHealthRelated,
          },
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearMessages = () => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        type: 'bot',
        content: "• Hello! I am MediCore AI.\n• Your virtual hospital assistant.\n• I can help with diseases, symptoms, medicines, doctors, and hospital services.",
        timestamp: new Date(),
      },
    });
  };

  return (
    <ChatbotContext.Provider
      value={{
        ...state,
        toggleChatbot,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
