import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const parsedTokens = JSON.parse(tokens);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: JSON.parse(localStorage.getItem('user')),
          tokens: parsedTokens,
        },
      });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        localStorage.setItem('tokens', JSON.stringify(tokens));
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, tokens },
        });

        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message,
      });
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Sending registration request to:', '/auth/register');
      console.log('Registration data:', userData);
      
      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data);

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        localStorage.setItem('tokens', JSON.stringify(tokens));
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, tokens },
        });

        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      let message = error.response?.data?.message || 'Registration failed';
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        message = `${message}: ${error.response.data.errors.map(e => e.msg).join(', ')}`;
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Network error. Please try again.';
      }
      
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify({ ...state.user, ...userData }));
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
