const defaultState = {
  selected: null,
  filters: { critical: false, inbound: false, unknown: false },
  radarMode: 'balanced',
  difficulty: 'EASY',
};

export const store = {
  state: { ...defaultState },
  set(partial){
    this.state = { ...this.state, ...partial };
  },
  setFilter(key, val){
    this.state = { ...this.state, filters: { ...this.state.filters, [key]: val } };
  },
  reset(){
    this.state = { ...defaultState };
  }
};
