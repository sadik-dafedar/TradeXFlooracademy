# TradeX Floor Academy - Codebase Analysis & Restructuring Plan

## Current Issues Identified

### 1. Duplicate API Route Structures
**Critical Conflicts:**
- `trading-backend/src/routes/` vs `backend/src/routes/`
- Both have similar route files (assets.py, auth.py, orders.py, positions.py, users.py, watchlist.py)
- Different implementations and dependencies
- Frontend `proxy: "http://localhost:5001"` vs backend port conflicts

### 2. Frontend Configuration Issues
- `package.json` proxy points to port 5001 but backend runs on 5000
- Missing react-router-dom for routing functionality
- Backend port not configured to handle frontend proxy

### 3. Shared Data Management
- `shared/` directory exists but not properly integrated
- Duplicate data models across backend implementations
- No centralized type definitions

### 4. Database & Environment Setup
- Multiple database configurations
- Missing environment variables for proper connection
- Docker configuration needs optimization

## Restructuring Plan

### Phase 1: Backend Consolidation
1. **Choose Primary Backend**: `backend/` (more complete implementation)
2. **Remove Duplicate**: `trading-backend/` 
3. **Update Port**: Change backend to port 5001 to match frontend proxy
4. **Consolidate Routes**: Merge any unique functionality from trading-backend

### Phase 2: Frontend Integration
1. **Fix Proxy**: Ensure backend runs on correct port (5001)
2. **Add Dependencies**: Install missing react-router-dom
3. **Update API Calls**: Ensure all frontend API calls use correct endpoints
4. **Implement Routing**: Set up proper React Router for navigation

### Phase 3: Shared Components
1. **Centralize Models**: Move shared data models to `shared/`
2. **Type Definitions**: Create TypeScript definitions for API contracts
3. **Validation**: Implement consistent validation across frontend/backend

### Phase 4: Database Setup
1. **Configure Database**: Set up PostgreSQL with proper schema
2. **Environment Variables**: Create comprehensive .env configuration
3. **Migrations**: Implement database migration system

### Phase 5: Testing & Documentation
1. **API Testing**: Ensure all endpoints work correctly
2. **Integration Testing**: Test frontend-backend communication
3. **Update README**: Document proper setup and running procedures

## Immediate Action Items

1. Decide which backend implementation to keep
2. Fix port configuration mismatch
3. Install missing frontend dependencies
4. Set up proper environment configuration
5. Test basic API connectivity

## File Structure After Restructuring

```
TradeXFlooracademy/
├── frontend/          # React frontend
├── backend/           # Consolidated Flask backend
├── shared/            # Shared types and models
├── database/          # Database schemas and migrations
├── docker/            # Docker configurations
├── docs/              # Documentation
└── scripts/           # Setup and utility scripts
```

This plan will resolve conflicts, improve maintainability, and provide a solid foundation for the trading application development.