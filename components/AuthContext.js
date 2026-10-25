'use client';

import { createContext, useContext } from 'react';

const AuthContext = createContext({
    openAuthModal: (mode) => { },
});

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
