const createActionQueue = ( MAX_LENGTH, MAX_OWNERSHIP ) => {
    const queue = [];
    return {
        hasAction: () => {
            return queue.length > 0;
        },
        getAction: () => {
            return queue.shift();
        },
        addActions: ( actions , messages, owner ) => {
            const owned = queue.filter( a => a["owner"] === owner ).length;
            const num_to_add = Math.min(MAX_LENGTH - queue.length, Math.min( MAX_OWNERSHIP - owned, actions.length ) );
            for( var i = 0; i < num_to_add; i++ ) {
                queue.push( { action: actions[i], message: messages[i] , owner: owner } );
            }
        },
        getQueue: () => {
            return queue;
        }
    }
}

module.exports = {
    createActionQueue: createActionQueue,
}
