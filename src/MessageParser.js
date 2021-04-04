const isNumeric = ( c ) => {
    return c >= "0" && c <= "9";
}

const repeatArray = ( arr , length ) => {
    return Array.from( { length }, () => arr ).flat();
}

const messageExpander = ( m , legal_buttons ) => {
    // console.log(`move expander called on move ${m} with buttons ${legal_buttons}`);
    var built_up_actions = "";
    var action = "";
    var repeat = 0;
    var state = "SINGLE_ACTION" // can serve as starting state

    var add_actions = () => {
        // console.log(`add actions: action ${action}, repeat ${repeat}`)
        built_up_actions += action.repeat( repeat );
        repeat = 0;
        action = [];
    }

    var state_to_transition = {
        "SINGLE_ACTION": (c) => {
            // console.log(`SINGLE ACTION transitoin with c: ${c}`);
            if( isNumeric( c ) ) {
                repeat = parseInt( c );
                return "BUILDING_REPEAT";
            } 
            
            repeat = 1;
            add_actions();
            if( c == "(" ) {
                return "BUILDING_ACTION";
            } else {
                action = c;
                return "SINGLE_ACTION";
            }
        },
        "BUILDING_ACTION": (c) => { 
            // console.log(`BUILDING ACTION transition with c: ${c}`);
            if( c == ")" ) {
                // comment if we don't want recursive parsing
                action = messageExpander( action , legal_buttons );
                return "BUILDING_REPEAT";
            }
            action += c;
            // console.log(`BUILDING ACTION transition created action: ${action}`);
            return "BUILDING_ACTION";
        },
        "BUILDING_REPEAT": (c) => {
            // console.log(`BUILDING REPEAT transition with c: ${c}`);
            if( isNumeric( c ) ) {
                repeat = repeat * 10 + parseInt( c );
                return "BUILDING_REPEAT";
            }
            add_actions();
            if( c == "(" ) {
                return "BUILDING_ACTION";
            } else {
                action = c;
                return "SINGLE_ACTION";
            }
        }
    }
    
    for( var i = 0; i < m.length; i ++ ) {
        var c = m[i];
        // console.log(`moveExpander iteration i: ${i}, c: ${c}, state: ${state}`);
        if ( c in legal_buttons || isNumeric( c ) || c == "(" || c == ")" )  {
            state = state_to_transition[state]( c );
        } else {
            // uncomment to fail on bad inputs
            // return built_up_actions;
        }
    }


    if( state == "SINGLE_ACTION" ) {
        repeat = 1;
    }
    add_actions();

    return built_up_actions;
}

const messageToActions = ( m , legal_buttons ) => {
    actions = [];
    for( var i = 0; i < m.length; i++ ) {
        actions.push( legal_buttons[ m[i] ] );
    }
    return actions;
}

const getActions = ( m , legal_buttons ) => {
    var expandedM = messageExpander( m , legal_buttons );
    var actions = messageToActions( expandedM , legal_buttons );
    return {
        messages: expandedM, 
        actions: actions
    };
}

// moveExpander( "ABL" );
// moveExpander( "AB(AB2L)20RRRRR" );

module.exports = {
    getActions: getActions,
}
