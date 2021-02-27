import State from '../../src/Server/State';

describe('State.mutate', () => {
    it('Mutates internal state correctly without interceptStateUpdate middleware', () => {
        const state = new State(
            {
                initialValue: {
                    propertyA: 1,
                    propertyB: 2,
                }
            }
        ,() => {});

        state.mutate({ propertyA: 3 }, null);

        expect(state.getState()).toEqual({
            propertyA: 3,
            propertyB: 2,
        });
    });

    it('Mutates internal state correctly when interceptStateUpdate modifies state', () => {
        const state = new State(
            {
                initialValue: {
                    propertyA: 1,
                    propertyB: 2,
                },
                interceptStateUpdate: (_, __) => {
                    return {
                        propertyA: 10
                    };
                }
            }
        ,() => {});

        state.mutate({ propertyA: 3 }, null);

        expect(state.getState()).toEqual({
            propertyA: 10,
            propertyB: 2,
        });
    });

    it('Does not complete mutation when interceptStateUpdate returns null', () => {
        const state = new State(
            {
                initialValue: {
                    propertyA: 1,
                    propertyB: 2,
                },
                interceptStateUpdate: (_, __) => {
                    return null;
                }
            }
        ,() => {});

        state.mutate({ propertyA: 3 }, null);

        expect(state.getState()).toEqual({
            propertyA: 1,
            propertyB: 2,
        });
    });
});