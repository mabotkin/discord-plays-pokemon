const wsTokens = [ "*" , " " ];
const numericTokens = [...Array(10).keys()].map( n => n.toString() );
const parenthesesTokens = [ "(" , ")" ];

const isNumeric = ( c ) => {
    return c >= "0" && c <= "9";
}

const repeatArray = ( arr , length ) => {
    return Array.from( { length }, () => arr ).flat();
}

const messageTokenizer = ( m , legal_buttons ) => {
    const validTokens = Object.keys( legal_buttons )
        .sort( ( a , b ) => b.length - a.length )
        .concat( wsTokens )
        .concat( numericTokens )
        .concat( parenthesesTokens );

    const tokens = [];
    var i = 0;

    while( i < m.length ) {
        var l = 0;
        for( token of validTokens ) {
            if( m.substring( i , i + token.length ) == token ) {
                l = token.length;
                break;
            }
        }

        if( l == 0 ) {
            // invalid input, don't
            return [];
        }

        var token = m.substring( i , i + l );
        
        if( 
            token in legal_buttons
            || numericTokens.includes(token)
            || parenthesesTokens.includes(token)
        ) {
            tokens.push( token );
        }
        i += l;
    }

    return tokens;
}

const messageExpander = ( m , legal_buttons ) => {
    // console.log(`move expander called on move ${m} with buttons ${legal_buttons}`);
    var built_up_actions = [];
    var action = [];
    var repeat = 0;
    var expression_depth = 0;
    var state = "SINGLE_ACTION" // can serve as starting state

    var add_actions = () => {
        // console.log(`add actions: action ${action}, repeat ${repeat}`)
        repeat = repeat == 0 ? 1 : repeat;
        built_up_actions = built_up_actions.concat( repeatArray( action, repeat ) );
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
            
            add_actions();
            if( c == "(" ) {
                expression_depth += 1;
                return "BUILDING_ACTION";
            } else {
                action = [c];
                return "SINGLE_ACTION";
            }
        },
        "BUILDING_ACTION": (c) => { 
            // console.log(`BUILDING ACTION transition with c: ${c}`);
            if( c == "(" ) {
                expression_depth +=1;
            } else if( c == ")" ) {
                // comment if we don't want recursive parsing
                expression_depth -= 1;
                if( expression_depth == 0 ) {
                    action = messageExpander( action , legal_buttons );
                    return "BUILDING_REPEAT";
                }
                action.push(c);
                return "BUILDING_ACTION";
            }
            action.push(c);
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
                expression_depth += 1;
                return "BUILDING_ACTION";
            } else {
                action = [c];
                return "SINGLE_ACTION";
            }
        }
    }
    
    for( var i = 0; i < m.length; i ++ ) {
        var c = m[i];
        // console.log(`moveExpander iteration i: ${i}, c: ${c}, state: ${state}`);
        state = state_to_transition[state]( c );
    }

    if( state == "BUILDING_ACTION" ) {
        action = messageExpander( action, legal_buttons );
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
    var messageTokens = messageTokenizer( m , legal_buttons );
    // console.log("message tokens: ", messageTokens);
    var expandedM = messageExpander( messageTokens , legal_buttons );
    // console.log("expanded m: ", expandedM);
    var actions = messageToActions( expandedM , legal_buttons );
    // console.log("actions: ", actions);
    return {
        messages: expandedM, 
        actions: actions
    };
}

var legal_buttons = {
	"A" : "keypad.A",
	"B" : "keypad.B",
	"SELECT" : "keypad.SELECT",
	"START" : "keypad.START",
	"RIGHT" : "keypad.RIGHT",
	"LEFT" : "keypad.LEFT",
	"UP" : "keypad.UP",
	"DOWN" : "keypad.DOWN",
	"R" : "keypad.RIGHT",
	"L" : "keypad.LEFT",
	"U" : "keypad.UP",
	"D" : "keypad.DOWN",
	">" : "keypad.RIGHT",
	"<" : "keypad.LEFT",
	"^" : "keypad.UP",
	"V" : "keypad.DOWN",
	"RT" : "keypad.R",
	"LT" : "keypad.L"
};


// Tests
// console.log( messageExpander( "ABL" ) );
// console.log( messageExpander( "AB(AB2L)20RRRRR" ) );

// console.log( messageTokenizer( "ABSTART L", legal_buttons ) );
// console.log( messageTokenizer( "A * 20(LB)20", legal_buttons ) );
// console.log( messageExpander( "(a2)b" , legal_buttons ) );
// console.log( messageExpander( "((a2)2)2" , legal_buttons ) );
// console.log( messageExpander( "(((a2)22" , legal_buttons ) );

module.exports = {
    getActions: getActions,
}
