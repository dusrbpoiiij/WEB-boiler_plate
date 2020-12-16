import { combineReducers } from 'redux';
import user from './user_reducer';

// 여러가지 Reducer를 하나로 합치는 과정 
const rootReducer = combineReducers({
  user,
})

export default rootReducer;