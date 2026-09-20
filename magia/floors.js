window.MAGIA_FLOORS = [
  {
    n: 1, roman: "I", title: "El taller secreto",
    concept: "Una escalera que sube de diez en diez. Un armario de disfraces para las medidas. Una aduana de pasaportes. Una receta que se arma pieza por pieza.",
    tuts: [
      {
        id: "1.1", kind: "tens", title: "La escalera de dieces",
        pov: "Las potencias de diez. Cada peldaño sube de diez en diez.",
        toys: "Ábaco Hape · Measure Up Cups · canicas Grapat · pirámide Grimm’s · Monopoly Junior",
        why: "El ábaco es la única escalera de dieces que se toca sin escribir ceros.",
        say: [
          "Ven. En el ábaco, una cuenta de abajo vale uno. Una hilera entera, diez. Diez hileras, cien. No cuentes hasta cien de una en una: sube peldaños.",
          "Pon canicas en los cuencos. El chico es peldaño cero: el número desnudo. El mediano es diez. El grande es la idea de cien. Señala el peldaño.",
          "Bajar: parte el tesoro con el vaso más chico. Un peldaño hacia abajo es 0,1: un pedacito. Dos peldaños, 0,01: una hormiga.",
          "Cambia diez monedas chicas por un billete de diez. El tesoro no cambió. Cambió el peldaño. Eso es notación de ingeniería."
        ],
        hint: ["Toca el ábaco de madera. Arrástralo: se mueve un poco torpe.", "Arrastra las canicas de verdad a los tres cuencos.", "Arrastra el vaso chico sobre el gordo.", "Arrastra diez billetes de 1 sobre el de 10."],
        q: { text: "Si subes tres peldaños de diez en diez empezando en 1, ¿llegas a 10, a 100 o a 1.000?", opts: ["10", "100", "1.000"], ok: 2, good: "¡1.000! Un peldaño es 10, dos son 100, tres son 1.000.", bad: "Cuenta los peldaños: 1 → 10 → 100 → 1.000." }
      },
      {
        id: "1.2", kind: "costume", title: "El armario de los disfraces",
        pov: "Los prefijos. Cambiar de ropa no cambia el tesoro.",
        toys: "Sarah’s Silks · Mr. Potato Head · Measure Up Cups · Monopoly Junior · un Nin Grapat",
        why: "Potato Head es el disfraz. Measure Up convierte el prefijo en un vertido. Las telas dan cuerpo a enorme y diminuto.",
        say: [
          "El Nin es un metro, un segundo, un litro: la unidad desnuda. La tela grande es kilo: mil Nins debajo. El pañuelo es mili: el Nin cortado en mil rebanadas.",
          "Cámbiale los sombreros al Potato Head. Tera, giga, mega, kilo, mili, micro, nano, pico son sombreros. El tesoro no se mueve.",
          "Llena el vaso 1 cinco veces y viértelo en el 5. Mismo agua, otro disfraz. El número de delante se hace más chico porque cada vaso ahora es más gordo.",
          "Seis monedas de 1.000 se visten de «seis kilos». El número de delante se encoge. El tesoro es el mismo."
        ],
        hint: ["Arrastra la tela kilo o el pañuelo mili sobre el Nin.", "Ponle el sombrero a Potato Head.", "Arrastra el vaso chico sobre el gordo.", "Apila los billetes sobre el montón."],
        q: { text: "Si «kilo» significa mil, ¿un kilómetro es más largo o más corto que un metro?", opts: ["Más largo", "Más corto", "Igual"], ok: 0, good: "Más largo: mil metros en un solo disfraz.", bad: "Kilo es mil. Un kilómetro son mil metros." }
      },
      {
        id: "1.3", kind: "passport", title: "La aduana de los pasaportes",
        pov: "Convertir unidades. El tesoro no cambia de país. Cambia de pasaporte.",
        toys: "Waytoplay · Hot Wheels · reloj HABA · zapato y playsilk · balanza y caja PlanToys · Luggy · Measure Up",
        why: "Hot Wheels y Waytoplay son lejos, rápido, reloj. La balanza y los vasos son el diccionario.",
        say: [
          "Tres papeles: qué tan lejos, qué tan rápido, cuánto tarda. Deja uno vacío. El taller adivina el que falta.",
          "El coche recorre tramos. Corre el reloj. Eso es la velocidad: tramos por minuto. Si dejas vacío el reloj, el taller te da el tiempo.",
          "Mide el mismo pasillo con el zapato y con el silk. El número cambia. El pasillo no. Un pie no es un metro.",
          "En la balanza: un lado libras, el otro kilos. Mismo tesoro, dos pasaportes. Un litro es más chico que un metro cúbico."
        ],
        hint: ["Toca el pasaporte, el coche o el reloj.", "Arrastra el coche por la mesa.", "Arrastra el zapato y el silk.", "Pon canicas en los cuencos de la balanza."],
        q: { text: "Si dejas vacío el papel del reloj y ya sabes el camino y la velocidad, ¿qué te calcula el taller?", opts: ["El tiempo", "El color", "El sabor"], ok: 0, good: "El tiempo. No el color. No el sabor.", bad: "Con camino y velocidad, el taller calcula el tiempo." }
      },
      {
        id: "1.4", kind: "recipe", title: "Primero lo de adentro",
        pov: "El orden de las recetas. The Incredible Machine, con las manos.",
        toys: "Mouse Trap · Kapla · arcoíris Grimm’s · Connect 4 · una canica y un cuenco",
        why: "Mouse Trap es la Máquina Increíble sin pantalla. El arcoíris enseña el paréntesis.",
        say: [
          "Receta 6(4+8). En Connect 4, junta primero cuatro y ocho: doce. Luego seis veces ese plato. Si multiplicas antes, la receta se rompe.",
          "El paréntesis es el arco de adentro: se nombra primero. Un triángulo de Kapla es el atajo: se mira, no se reza.",
          "Mouse Trap. Una manivela, un tope, una red, una bola. El acertijo es: haz que la canica llegue al cuenco. Pieza por pieza.",
          "Vuelca todas las Kapla y espera. No llega. La materia se anima cuando las piezas van en orden."
        ],
        hint: ["Toca el Connect 4. El arcoíris es el paréntesis.", "Arrastra el triángulo de listones.", "Lleva la canica al cuenco, pieza por pieza.", "Los listones sueltos no llegan solos."],
        q: { text: "Si la receta dice «primero junta lo de adentro del paréntesis», ¿qué haces primero?", opts: ["4+8", "Multiplicar por 6", "Tirar todas las piezas"], ok: 0, good: "Primero 4+8. Luego el resto. La máquina se construye pieza por pieza.", bad: "El paréntesis se nombra primero: 4+8, después el 6." }
      }
    ]
  },
  {
    n: 2, roman: "II", title: "El país de las canicas",
    concept: "Canicas diminutas con un más o un menos. El desfile es cuántas cruzan el túnel en un segundo. El empujón es lo alto del tobogán.",
    tuts: [
      {
        id: "2.1", kind: "casita", title: "Las casitas y el hechizo del prado",
        pov: "El átomo y Coulomb. Distintas se buscan. Iguales se empujan. Lejos, el hechizo se debilita de prisa.",
        toys: "Cuenco Grapat · canicas Grimm’s y Grapat · Nins · varitas TickiT · Connetix · playsilk",
        why: "Las varitas son el Coulomb que se siente. El cuenco-núcleo hace visible la casita.",
        say: [
          "Arma la casita: en el cuenco, canicas pesadas (más) y Nins quietos (neutrones). Alrededor, las ligeras dan vueltas.",
          "Tres casitas. Conductor: las invitadas salen con un soplo. Aislante: no salen. Semiconductor: solo si se lo pides con la linterna.",
          "El hechizo en el prado. Distintas se buscan. Iguales se empujan. Arrástralas. Un clic cambia el signo.",
          "Aleja las placas. Si duplicas la distancia, el hechizo no queda a la mitad: queda cuatro veces más chico."
        ],
        hint: ["Arrastra las canicas oscuras y los Nins al cuenco.", "Toca el cuenco generoso, o arrastra la linterna al de en medio.", "Arrastra las canicas. Clic para cambiar el signo.", "Arrastra las placas. Mira el hechizo."],
        q: { text: "Si una canica tiene un más y la otra un menos, ¿se buscan o se empujan?", opts: ["Se buscan", "Se empujan"], ok: 0, good: "¡Se buscan! Distintas se buscan; iguales se empujan.", bad: "Las distintas se buscan. Prueba la otra." }
      },
      {
        id: "2.2", kind: "parade", title: "El túnel del desfile",
        pov: "La corriente. Paquetes partido por tictacs. Un amperio es un paquete por segundo.",
        toys: "HABA Marble Run o Quadrilla · canicas · reloj de 1 minuto · KerPlunk · Connect 4",
        why: "El circuito de haya convierte I = Q / t en algo que se cuenta. KerPlunk es el fusible que se ve fallar.",
        say: [
          "No cuentes canicas sueltas para siempre: junta diez en un cuenco. Ese cuenco es un paquete.",
          "Suelta un paquete cada vez que el reloj lo pida. Un paquete por segundo es un desfile de un amperio. Más lento: un chorrito.",
          "Si pasaron seis paquetes en dos minutos, el desfile es tres por minuto. Tres huecos: desfile, paquetes, o reloj.",
          "KerPlunk: un palito es el fusible. Si el desfile es más gordo de lo acordado, la portezuela se abre y se queda abierta."
        ],
        hint: ["Arrastra diez canicas al cuenco-paquete.", "Toca el reloj para soltar un paquete.", "Cuenta los paquetes y los tictacs.", "Saca palitos. Si caen todas, el fusible fundió."],
        q: { text: "Si la corriente es «cuántas canicas pasan en un segundo», ¿qué mides?", opts: ["El desfile", "El color del túnel", "El sabor del aire"], ok: 0, good: "El desfile. Corriente es paquetes por tictac.", bad: "Corriente no es color ni sabor: es el desfile." }
      },
      {
        id: "2.3", kind: "ramp", title: "El tobogán y las tres alcancías",
        pov: "El voltaje. Empujón es trabajo por paquete. El zumo se cuenta en amperios-hora.",
        toys: "Hot Wheels Track Builder · dos coches · alcancía PlanToys · Monopoly · reloj · balanza · silk",
        why: "La rampa es el voltaje que se ve. La alcancía convierte Ah en algo que se echa a una hucha.",
        say: [
          "Las canicas no se mueven solas. El trabajo de subirlas, partido por los paquetes, es el empujón. Un voltio es un empujón justo.",
          "Rampa baja, rampa alta. El mismo coche. El tobogán más alto es más empujón, no menos.",
          "Tesoro total: empujón por desfile por reloj. La alcancía guarda zumo: más amperios-hora, más tesoro para el mismo empujón.",
          "El silk ondulado se tiende liso: el baile se vuelve río quieto. El dosificador suelta una canica por segundo da igual la rampa."
        ],
        hint: ["Suelta el coche por la rampa baja y por la alta.", "Cada llegada echa una moneda.", "Llena la alcancía: eso es Ah.", "Alisa el silk: el río se queda quieto."],
        q: { text: "Si el voltaje es el empujón de cada paquete, ¿un tobogán más alto significa más empujón o menos?", opts: ["Más empujón", "Menos empujón"], ok: 0, good: "Más empujón. Más alto el tobogán, más trabajo por paquete.", bad: "Más alto no es menos: es más empujón." }
      },
      {
        id: "2.4", kind: "materials", title: "Pasillos, puertas y dos relojes",
        pov: "Conductores, aislantes, semiconductores, amperímetro y voltímetro.",
        toys: "Play-Doh · Waytoplay · muro Kapla · Operation · Guess Who · túnel HABA",
        why: "Operation y Guess Who son los dos detectives. Play-Doh da los tres materiales en las manos.",
        say: [
          "Suelta una canica por Waytoplay: pasa con ganas. Eso es el cobre. Empújala contra el muro Kapla: no pasa. Eso es el vidrio.",
          "El churro «a veces»: frío y a oscuras, no deja. Lo calientas o le das la linterna, cede. Silicio: solo cuando se lo piden.",
          "Amperímetro: Operation se mete en la fila, como un torniquete. Cuenta las que cruzan. Si las pinzas estorban, el desfile se queja.",
          "Voltímetro: Guess Who se engancha al lado. Pregunta «¿el tobogán es alto?» sin meterse en el agua."
        ],
        hint: ["Suelta canicas por el pasillo y contra el muro.", "Calienta el churro o tráele la linterna.", "Pon Operation en la fila.", "Pon Guess Who al lado, no en el agua."],
        q: { text: "Si quieres contar las canicas que cruzan un túnel, ¿dónde pones el reloj?", opts: ["En la fila del desfile", "Al lado, midiendo el tobogán"], ok: 0, good: "En la fila. El de al lado mide el tobogán, no el desfile.", bad: "Para contar canicas, el reloj va en la fila." }
      }
    ]
  },
  {
    n: 3, roman: "III", title: "El pasillo pegajoso",
    concept: "Hoy el pasillo se queja. Un camino largo cansa más que uno corto. Uno flaco, más que uno gordo. El cobre es más amigo que el hierro.",
    tuts: [
      {
        id: "3.1", kind: "churro", title: "Largo, gordo, de qué está hecho",
        pov: "El cansancio del pasillo. Crece con lo largo y con lo difícil. Baja si el camino se hace más gordo.",
        toys: "Play-Doh Fun Factory · tres botes · HABA Marble Run · canicas · Kapla",
        why: "El Fun Factory es el pasillo pegajoso que se siente. El circuito de haya da tres caminos comparables.",
        say: [
          "Mismo empujón, tres churros. El corto y gordo de pasta blanda: las canicas salen de prisa. El largo y flaco de pasta seca: se quejan.",
          "Cambia una cosa cada vez. Primero solo el largo: el desfile se hace más flaco. Luego solo el gordo: el desfile engorda.",
          "Luego solo el material: mismo tamaño, bote seco. El desfile se queja otra vez.",
          "El listón de canto es poca área. El listón acostado, más área. La canica cruza mejor el acostado."
        ],
        hint: ["Empuja canicas por los tres churros.", "Alarga un churro con el deslizador.", "Cambia el material del bote.", "Acuesta o para de canto el listón Kapla."],
        q: { text: "Si el pasillo se hace más largo y más flaco, ¿el desfile se pone más gordo o más flaco, con el mismo empujón?", opts: ["Más gordo", "Más flaco"], ok: 1, good: "Más flaco. Largo cansa. Flaco cansa.", bad: "Más largo y más flaco cansan más: el desfile se adelgaza." }
      },
      {
        id: "3.2", kind: "awg", title: "El calibre: cada tres números, a la mitad",
        pov: "La tabla AWG. Más gordo, más fácil. Cada tres calibres, el área se parte en dos.",
        toys: "Measure Up Cups · arcoíris Grimm’s · Waytoplay · cuencos Grapat · UNO · un Nin",
        why: "El arcoíris es la tabla AWG que se anida. Measure Up ya comprado sirve de boca-calibre.",
        say: [
          "El arco más chico es un calibre alto, un hilo de hormiga: el Nin apenas cabe. El arco más grande es un calibre bajo: pasa holgado.",
          "Cada tres arcos hacia adentro: el área se hizo la mitad, el cansancio se duplicó. Tres saltos, la mitad de hueco.",
          "El vaso 1 es el AWG flaco; el 5, el gordo. Vierte el mismo tesoro. El gordo no se queja.",
          "Una cinta, el Nin cruza justo. Dos cintas en paralelo, más área, menos cansancio."
        ],
        hint: ["Haz pasar al Nin por arcos cada vez más gordos.", "Cuenta de tres en tres hacia adentro.", "Vierte del vaso 1 al 5.", "Pon dos cintas juntas."],
        q: { text: "Si eliges un cable más gordo para el mismo largo y el mismo cobre, ¿el pasillo se pone más pegajoso o más fácil?", opts: ["Más pegajoso", "Más fácil"], ok: 1, good: "Más fácil. Más gordo, menos cansancio.", bad: "Gordo es amigo: el pasillo se pone más fácil." }
      },
      {
        id: "3.3", kind: "heatice", title: "El calor queja, el hielo calla",
        pov: "Temperatura, termistor y superconductor. Los metales se ponen pegajosos al calentarse.",
        toys: "Play-Doh fresco y amasado · Don’t Break the Ice · reloj HABA · linterna · canicas",
        why: "Don’t Break the Ice es el hielo que se hereda al cubo. Play-Doh caliente/frío distingue metal de NTC.",
        say: [
          "Metal: al calentarlo no quieres que se ponga más fácil. El desfile se queja más. Un cable en el Atacama no es el de la ficha.",
          "NTC / carbono: el Play-Doh blando. Al amasarlo se pone más fácil. Cuando se calienta, abre el camino y avisa.",
          "Don’t Break the Ice: mientras el hielo está entero, el osito resbala sin queja —cansancio cero. Si sacas cubitos, ya no es superconductor.",
          "Cubre el circuito con el silk (noche). Las canicas dudan. Abre (sol). Pasan. Más luz, menos cansancio."
        ],
        hint: ["Calienta el churro de metal.", "Amasa el churro blando.", "Saca cubitos: el camino se rompe.", "Cubre y destapa el silk."],
        q: { text: "Si calientas un pasillo de cobre, ¿las canicas lo tienen más fácil o más difícil?", opts: ["Más fácil", "Más difícil"], ok: 1, good: "Más difícil. El cobre caliente se queja más.", bad: "Los metales suben el cansancio al calentarse." }
      },
      {
        id: "3.4", kind: "bands", title: "El tapón con disfraz",
        pov: "Código de color, conductancia, ohmímetro, potenciómetro y varistor.",
        toys: "Mandala Grapat o UNO · Potato Head · palito Kapla · Perfection · Hungry Hungry Hippos",
        why: "Grapat convierte el código de color en una fila. Perfection es el ohmímetro. Los hipopótamos, el varistor.",
        say: [
          "Cuatro anillos: dígito, dígito, multiplicador, «qué tan justo». Verde-azul-naranja es 56 y tres peldaños: cincuenta y seis mil.",
          "Dale la vuelta al reloj. En vez de «cuánto se queja», pregunta cuántas canicas por segundo deja pasar. Lo fácil es uno partido por lo pegajoso.",
          "Perfection: pieza que entra sola, cansancio cero. Pieza que no entra, abierto. Nunca con el palacio encendido.",
          "El hipopótamo no come con un empujón chiquito. Cuando el empujón cruza el umbral, se lo lleva todo. Eso es el varistor."
        ],
        hint: ["Enfila cuatro anillos de color.", "Toca «lo fácil» para invertir el reloj.", "Encaja piezas en Perfection.", "Aprieta de verdad para que el hipopótamo coma."],
        q: { text: "Si un tapón entra fácil en Perfection, ¿su pasillo es pegajoso o es un puente?", opts: ["Pegajoso", "Un puente"], ok: 1, good: "Un puente. Si entra fácil, cansancio casi cero.", bad: "Fácil de encajar es cansancio casi cero: un puente." }
      }
    ]
  },
  {
    n: 4, roman: "IV", title: "Las cuatro cuentas",
    concept: "Los tres amigos —empujón, desfile, cansancio— nunca se separan. El tesoro corre: potencia. Ninguna cadena entrega todo: eficiencia. El tesoro se cuenta con un reloj: energía.",
    tuts: [
      {
        id: "4.1", kind: "ohm", title: "Los tres amigos nunca se separan",
        pov: "La ley de Ohm. Si conoces a dos, adivinas al tercero.",
        toys: "Tres ratones Maileg · Fun Factory · tres botes · canicas Grapat",
        why: "El Fun Factory es un Ohm de pasta. Los tres Maileg dan cuerpo a una terna que, si no se toca, se olvida.",
        say: [
          "Presenta a los tres amigos: Empujón, Desfile y Cansancio. Nunca se separan. Si dos están en la mesa, el tercero aparece.",
          "Churro blando y churro seco. El mismo empujón de tus manos. En el blando el desfile es gordo. En el seco, flaco.",
          "Ahora empuja más fuerte por el mismo churro seco. El desfile engorda. El cansancio no se ha movido.",
          "Mismo empujón, un churro más largo. El desfile se hace flaco. El empujón es el desfile por el cansancio."
        ],
        hint: ["Toca cada ratón para oír su nombre.", "Empuja por el blando y por el seco.", "Sube el empujón con el deslizador.", "Alarga el churro."],
        q: { text: "Si el empujón se queda igual y el pasillo se pone más pegajoso, ¿el desfile se hace más gordo o más flaco?", opts: ["Más gordo", "Más flaco"], ok: 1, good: "Más flaco. Los tres amigos nunca se separan.", bad: "Más pegajoso, mismo empujón: desfile más flaco." }
      },
      {
        id: "4.2", kind: "power", title: "Qué tan rápido corre el tesoro",
        pov: "La potencia. El tesoro no solo existe. Corre.",
        toys: "Luggy Olli Ella · Monopoly Junior · relojes HABA · Hot Wheels · balanza PlanToys",
        why: "Monopoly y la Luggy convierten el tesoro en algo que se cuenta. Los relojes impiden que «rápido» sea solo una sensación.",
        say: [
          "El tesoro son las monedas. La potencia es cuántas monedas llegan a la cesta en un minuto, no cuántas hay en total.",
          "Un coche baja la rampa corta. Cada llegada, una moneda. Un minuto. Luego la rampa perezosa. El tesoro ha corrido más despacio.",
          "Dos coches a la vez. El desfile se hizo el doble. Si se chocan, el pasillo se queja: el tesoro perdido no es el doble, es más.",
          "Pon las cestas en la balanza. El montón más alto es más tesoro por minuto. Eso es un vatio: un bocado por segundo."
        ],
        hint: ["Suelta el coche por la rampa corta.", "Compara con la rampa larga.", "Suelta dos coches a la vez.", "Mira las dos cestas."],
        q: { text: "Si el desfile se hace el doble y el pasillo se queda igual, ¿el tesoro que se pierde se hace el doble, o más que el doble?", opts: ["El doble", "Más que el doble"], ok: 1, good: "Más que el doble. Las manos lo notan cuando los dos coches se estorban.", bad: "El pasillo se queja más que el doble si el desfile se dobla." }
      },
      {
        id: "4.3", kind: "eff", title: "Lo que llega y lo que se pierde",
        pov: "La eficiencia. El eslabón flojo se come el resto.",
        toys: "Operation · tres cuencos Grapat · canicas de un color · playsilk · caja registradora",
        why: "Operation es un eslabón que falla. Los cuencos hacen visible la multiplicación.",
        say: [
          "Las canicas salen de un cuenco-fuente. Tienen que llegar al cuenco-casa pasando por tres eslabones.",
          "Eslabón 1: pasar sin que se caiga ninguna. Eslabón 2: un turno de Operation. Si suena, se pierde la mitad.",
          "Eslabón 3: las que quedan se venden. Eficiencia es lo que llega partido por lo que salió.",
          "Si el segundo eslabón es flojo, da igual que el primero y el tercero sean perfectos: las eficiencias se multiplican."
        ],
        hint: ["Pasa 10 canicas de cuenco a cuenco.", "Juega Operation: si suena, se pierde la mitad.", "Vende lo que queda.", "Cambia el orden de los eslabones."],
        q: { text: "Si una cadena tiene un eslabón flojo, ¿el tesoro que llega se parece más al eslabón más fuerte o al más flojo?", opts: ["Al más fuerte", "Al más flojo"], ok: 1, good: "Al más flojo. Las eficiencias se multiplican.", bad: "El tesoro se parece al eslabón más flojo, no al más fuerte." }
      },
      {
        id: "4.4", kind: "energy", title: "El tesoro y el reloj",
        pov: "La energía. Tesoro es rapidez por tiempo. Duplicar el tiempo duplica el tesoro, no la rapidez.",
        toys: "Linterna · relojes HABA de 1 y 2 minutos · Monopoly · Life Junior · Luggy",
        why: "Sin un reloj de verdad, energía y potencia se confunden. La linterna no cambia de brillo.",
        say: [
          "Enciende la linterna. Brilla igual al segundo 1 y al segundo 60. No se vuelve más brillante por estar más rato encendida.",
          "Un minuto gasta una moneda. Dos minutos, dos monedas. Mismo brillo. El tesoro se duplicó. La rapidez, no.",
          "Tres vueltas de Life Junior: cada vuelta es una hora de planta. Tres vueltas, tres alquileres. El aparato no se volvió más gordo: el reloj sí.",
          "Tesoro es rapidez por tiempo. El medidor de la puerta cuenta kilovatios-hora, no qué tan brillante se ve ahora."
        ],
        hint: ["Enciende la linterna.", "Deja correr 1 minuto, luego 2.", "Juega tres vueltas.", "Mira la factura, no el brillo."],
        q: { text: "Si dejas una lamparita el doble de tiempo, ¿se vuelve el doble de brillante, o solo gasta el doble de tesoro?", opts: ["El doble de brillante", "Solo gasta el doble de tesoro"], ok: 1, good: "Solo gasta el doble de tesoro. El brillo es la rapidez; el tesoro lleva reloj.", bad: "El brillo no cambia. Cambia la factura." }
      }
    ]
  },
  {
    n: 5, roman: "V", title: "Una sola fila",
    concept: "Hoy las canicas tienen un solo camino. Si alguien se para, se para todo el mundo. El cansancio se suma. El desfile es el mismo. El empujón se rebanada.",
    tuts: [
      {
        id: "5.1", kind: "series", variant: "identity", title: "Un solo camino, un solo desfile",
        pov: "La identidad de la fila. El desfile es el mismo en todos.",
        toys: "Connect 4 · Waytoplay en una sola cinta · Hot Wheels · Little People · canicas",
        why: "Una columna de Connect 4 y una cinta sin bifurcaciones: no hay lado.",
        say: [
          "Monta una cinta de casa a casa. Un solo coche. Si alguien tapa el camino, no puede saltar al lado: no hay lado.",
          "Connect 4 con una regla nueva: solo una columna. La de abajo, la del medio y la de arriba son el mismo desfile.",
          "Tres cuencos en fila. Una canica entra. Pasa por los tres. No se parte. El desfile es el mismo.",
          "En serie, las canicas no eligen. Hay un solo punto común."
        ],
        hint: ["Tapa el camino con un Nin.", "Llena una sola columna.", "Suelta una canica por tres arcos.", "Busca un desvío: hoy no hay."],
        q: { text: "Si en una fila se abre un fusible, ¿se apaga solo ese trozo o se apaga toda la fila?", opts: ["Solo ese trozo", "Toda la fila"], ok: 1, good: "Toda la fila. Un solo camino: si se abre, se apagan todos.", bad: "En serie no hay lado. Se apaga toda la fila." }
      },
      {
        id: "5.2", kind: "series", variant: "sum", title: "El cansancio se suma",
        pov: "Resistencias en serie. Lo pegajoso de uno más lo pegajoso del otro.",
        toys: "HABA Marble Run · tramo liso, campana, zigzag · canicas Grimm’s y Grapat · Play-Doh",
        why: "Tres tramos seguidos. El desfile no cambió de número: cambió de prisa.",
        say: [
          "Suelta una canica por un tramo liso. Cuenta.",
          "Añade el zigzag detrás. La misma canica, el mismo empujón. Tarda más. El cansancio total es la suma.",
          "Añade la campana. Más suma. El desfile (una canica, no dos) no cambió de número.",
          "Con Play-Doh, empuja una bola por tres churros pegados. Siente que el cansancio de los tres se añade."
        ],
        hint: ["Suelta por el tramo liso.", "Añade el zigzag.", "Añade la campana.", "Empuja por tres churros en fila."],
        q: { text: "Si la raya del cuaderno está casi tumbada, ¿el pasillo es fácil o difícil?", opts: ["Fácil", "Difícil"], ok: 1, good: "Difícil. El zigzag largo es la raya tumbada.", bad: "Raya tumbada: el pasillo es difícil." }
      },
      {
        id: "5.3", kind: "divider", title: "El rebanador de empujón",
        pov: "El divisor de voltaje. Al más cansado le toca más rebanada.",
        toys: "Pirámide Grimm’s · tres Nins o Maileg · UNO 1, 3 y 5 · balanza PlanToys",
        why: "Los peldaños de distinto alto se comen su altura. El más alto se come más empujón.",
        say: [
          "Tres peldaños de distinto alto. El empujón total es bajar desde el más alto hasta el suelo. Cada peldaño se come su altura.",
          "Cartas 1, 3 y 5. El empujón total es 9. La rebanada de cada uno es su número partido por 9. El 5 se lleva más.",
          "Si cambias 1, 3, 5 por 2, 6, 10, las rebanadas siguen iguales. Las razones no cambian si escalas todos los tapones.",
          "Al más cansado le toca más empujón."
        ],
        hint: ["Mira las alturas de los peldaños.", "Reparte las cartas 1, 3 y 5.", "Dobla los números: las razones quedan.", "Sienta al Nin gordo frente al flaco."],
        q: { text: "Si un tapón es más cansado que su vecino, ¿le toca más empujón o menos?", opts: ["Más empujón", "Menos empujón"], ok: 0, good: "Más empujón. Al más cansado le toca más rebanada.", bad: "El más pegajoso se come más altura." }
      },
      {
        id: "5.4", kind: "series", variant: "fuse", title: "Si uno se abre, se apagan todos",
        pov: "El circuito abierto en serie. El fusible de la tira.",
        toys: "Don’t Break the Ice · KerPlunk · Hot Wheels en fila · playsilk como fusible",
        why: "El osito se cae entero. No se cae «solo ese cubito».",
        say: [
          "Don’t Break the Ice: si sacas un cubito del camino de carga, el osito se cae entero.",
          "KerPlunk: una sola varilla sostiene a todas. Sácala. Todas caen. Fusible abierto en serie.",
          "Pista Hot Wheels en una sola cinta. Quita un tramo del medio. El coche no llega. No hay desvío.",
          "El playsilk como puente es el contraste: el corto anula al puenteado; el abierto apaga a todos."
        ],
        hint: ["Saca un cubito de hielo.", "Saca la varilla que sostiene.", "Quita un tramo de la pista.", "Pon el silk como puente: eso es otro cuento."],
        q: { text: "Si en una fila se abre un fusible, ¿se apaga solo ese trozo o se apaga toda la fila?", opts: ["Solo ese trozo", "Toda la fila"], ok: 1, good: "Toda la fila. Una pastilla, una tesela, una tira y un estante son la misma fila.", bad: "Abierto en serie apaga a todos." }
      }
    ]
  },
  {
    n: 6, roman: "VI", title: "Varios caminos a la vez",
    concept: "Dos casas comunes. El tobogán es el mismo en cada pasillo. El desfile se parte. Lo fácil se suma. Un fusible abierto saca una rama; las demás siguen.",
    tuts: [
      {
        id: "6.1", kind: "parallel", variant: "houses", title: "Las mismas dos casas",
        pov: "Paralelo: comparten las dos puntas, no solo una.",
        toys: "Casa Tender Leaf o Barbie · Connetix · tres Maileg · Waytoplay que se bifurca",
        why: "Todo camino válido tiene que tocar las dos casas.",
        say: [
          "Declara dos casas: la sala y el jardín. Todo camino válido tiene que tocar las dos.",
          "Tres pasillos entre las dos placas. Cada ratón elige un pasillo. El empujón es el mismo para los tres.",
          "Un camino que sale de A y se pierde no está en paralelo. El feeder no está en paralelo con las tiras.",
          "Una cinta se abre en dos y se cierra. Los dos coches bajan el mismo desnivel. Eso es el tobogán común."
        ],
        hint: ["Toca las dos casas.", "Pon un ratón en cada pasillo.", "Mira el camino que no vuelve.", "Bifurca la carretera y júntala."],
        q: { text: "Si se abre el fusible de una tira y las demás siguen enganchadas al mismo camino, ¿se apagan todas o solo esa?", opts: ["Todas", "Solo esa"], ok: 1, good: "Solo esa. Las demás siguen brillando.", bad: "En paralelo, una rama se va y el resto brilla." }
      },
      {
        id: "6.2", kind: "parallel", variant: "easy", title: "El camino fácil se lleva el desfile",
        pov: "El divisor de corriente. La rama de menos ohmios manda.",
        toys: "Hungry Hungry Hippos · Marble Run con dos salidas · Play-Doh fino y gordo",
        why: "El hipopótamo más goloso se lleva más desfile. Añadir un camino fácil alivia el palacio.",
        say: [
          "Las bolas están en el centro —un nudo—. Cada hipopótamo es una rama. El que abre más se lleva más desfile.",
          "Desde la misma plataforma, un camino liso y un zigzag. Casi todas eligen el liso.",
          "Empuja una bola hacia dos churros: la pasta se va por el gordo. El fino apenas come.",
          "Añade un tercer camino aún más fácil. El cansancio total baja. Añadir un camino fácil no cansa más: lo alivia."
        ],
        hint: ["Deja que los hipopótamos coman.", "Suelta diez canicas en el desvío.", "Empuja por dos churros.", "Añade un tercer camino."],
        q: { text: "Si dos caminos están en paralelo y uno es mucho más fácil, ¿quién se lleva casi todo el desfile?", opts: ["El fácil", "El difícil", "A partes iguales"], ok: 0, good: "El fácil. La rama de menos cansancio manda.", bad: "No es a partes iguales si uno es más goloso." }
      },
      {
        id: "6.3", kind: "kcl", title: "Lo que entra, sale",
        pov: "Kirchhoff del desfile. En un cruce, las canicas no se esconden.",
        toys: "Cuencos Grapat · Luggy como nudo · caminos Kapla o Waytoplay · papel y lápiz",
        why: "Nadie se esconde debajo de la cesta. Entra igual que sale.",
        say: [
          "La Luggy es el nudo. Nadie se esconde debajo de la cesta.",
          "Echa 3 por un camino, 4 por otro, 2 por el tercero. Entran 9. Saca 5. Tienen que salir 4 por el otro.",
          "Si una flecha sale negativa, es que iba al revés: cambia el sentido de esa rama.",
          "Siempre: entra igual que sale. En planta es la barra de una caja combinadora."
        ],
        hint: ["Echa canicas a la Luggy por tres caminos.", "Saca por un camino y cuenta el otro.", "Si falta, no las escondas en la manga.", "Cambia el sentido de una flecha."],
        q: { text: "Si a un cruce llegan tres desfiles y salen dos, ¿el que falta entra o sale?", opts: ["Sale, del tamaño que iguale", "Se esconde", "Desaparece"], ok: 0, good: "Sale, del tamaño que hace entra = sale.", bad: "Las canicas no se esconden: el que falta sale." }
      },
      {
        id: "6.4", kind: "parallel", variant: "fuse", title: "Se funde una, las demás brillan",
        pov: "El abierto en paralelo. El fusible de una tira no apaga la caja.",
        toys: "Hot Wheels dos rieles · dos coches · dos linternas · un palito = fusible",
        why: "Cubre una lámpara: la otra sigue. Un corto en paralelo se lleva el camino gordo.",
        say: [
          "Dos rieles entre el mismo inicio y el mismo final. Quita un riel. El otro coche sigue.",
          "Enciende dos linternas en paralelo. Cubre una con la mano. La otra sigue brillando.",
          "Contrasta con el piso 5: en serie, cubrir una apagaba el cuento entero.",
          "Un palito que une A con B sin cansancio: los dos coches se van por el palito y se paran. Un corto se lleva el camino gordo."
        ],
        hint: ["Quita un riel.", "Cubre una linterna.", "Recuerda la fila del piso 5.", "Pon un palito-corto entre las dos casas."],
        q: { text: "Si dos lamparitas están en paralelo y se funde una, ¿la otra se apaga o sigue brillando?", opts: ["Se apaga", "Sigue brillando"], ok: 1, good: "Sigue brillando. Por eso el alumbrado auxiliar no se apaga todo.", bad: "En paralelo, una se va y la otra sigue." }
      }
    ]
  },
  {
    n: 7, roman: "VII", title: "El palacio de adentro hacia afuera",
    concept: "El método es un cuento de muñecas rusas. Se reduce de adentro hacia afuera. Luego se reabre cada grupo. Tres detectives: desfile, empujón, cansancio.",
    tuts: [
      {
        id: "7.1", kind: "nest", title: "Muñecas rusas",
        pov: "Reducir de adentro hacia afuera y reabrir.",
        toys: "Arcoíris Grimm’s · Kapla · Connetix · tres Nins",
        why: "El arco de adentro se nombra primero. Luego el de afuera lo abraza.",
        say: [
          "El arcoíris ya es el método: el arco de adentro se ve primero, se nombra «un solo tapón», y el de afuera lo abraza.",
          "Un patio de cuatro paredes (paralelo) dentro de un pasillo de entrada (serie). No preguntes aún el desfile de la puerta.",
          "Sustituye el patio por un solo listón de color. Ahora el palacio es una fila corta. Pregunta el desfile.",
          "Reabre: quita el listón equivalente, vuelve a poner el patio, y con el desfile que ya conoces pregunta cada rincón."
        ],
        hint: ["Nombra primero el arco de adentro.", "Construye el patio dentro del pasillo.", "Sustituye el patio por un listón.", "Reabre el patio."],
        q: { text: "Si un puente anula dos lastres, ¿el cansancio total se parece más al feeder solo o a los lastres?", opts: ["Al feeder solo", "A los lastres"], ok: 0, good: "Al feeder solo. El puente anula el patio.", bad: "El puente se come los lastres: queda el feeder." }
      },
      {
        id: "7.2", kind: "ladder", title: "La escalera se baja desde el último peldaño",
        pov: "La red de escalera. Cada grifo extrae un poquito y carga al anterior.",
        toys: "Pirámide Grimm’s o escalera Kapla · Little People · canicas · Chutes and Ladders",
        why: "Si empiezas por el primero, el cuento se enreda: no sabes cuánto extrae el último.",
        say: [
          "Cuatro rellanos. El tesoro está abajo (la fuente). El último peldaño está más lejos.",
          "Empieza por el último: ese Nin se lleva una canica y deja el resto. El de arriba ahora ve un cansancio distinto.",
          "Si empiezas por el primero, el cuento se enreda.",
          "Añade un quinto Nin. Cada grifo extra no es gratis. El abrigo se cansa de otra manera."
        ],
        hint: ["Empieza por el último rellano.", "Deja el resto para el de arriba.", "Prueba a empezar por el primero: se enreda.", "Añade un quinto Nin."],
        q: { text: "Si empiezas a reducir una escalera por el primer peldaño, ¿el cuento sale derecho o se enreda?", opts: ["Sale derecho", "Se enreda"], ok: 1, good: "Se enreda. Se baja desde el último peldaño.", bad: "El método es bajar la cuenta desde el último." }
      },
      {
        id: "7.3", kind: "pot", title: "La invitada en el brazo del palito",
        pov: "El potenciómetro cargado. La invitada mueve el grifo.",
        toys: "Listón Kapla · un Nin cursor · hipopótamo goloso · canica educada · Play-Doh",
        why: "La carga golosa tuerce el palito. La educada casi no se nota.",
        say: [
          "El palito es una cadena de tapones. El Nin se sienta en el medio: grifo al 50 %. El empujón se parte.",
          "Engancha la canica educada. El Nin casi no se mueve. La carga es fácil de ignorar.",
          "Engancha el hipopótamo goloso. El palito se tuerce, el Nin se desliza. El tobogán del grifo ya no está donde lo dejaste.",
          "Mitiga: un colchón (un arco) entre el brazo y la golosa, o una carga diez veces más educada."
        ],
        hint: ["Sienta al Nin en el medio.", "Engancha la canica.", "Engancha el hipopótamo.", "Pon un arco-colchón."],
        q: { text: "Si enganchas una carga golosa en el brazo de un palito, ¿el tobogán del grifo se queda donde lo dejaste o se mueve?", opts: ["Se queda", "Se mueve"], ok: 1, good: "Se mueve. La invitada extrae desfile y cambia las caídas.", bad: "La golosa mueve el grifo." }
      },
      {
        id: "7.4", kind: "meters", title: "Tres detectives",
        pov: "Amperímetro, voltímetro, ohmímetro. Cómo se enganchan, para no comerse el cuento.",
        toys: "Operation · Guess Who · Perfection · rampa HABA",
        why: "El amperímetro es un atajito. El voltímetro pregunta al lado. El ohmímetro, con el palacio apagado.",
        say: [
          "Amperímetro. Se mete en la fila. Si las pinzas se ponen pegajosas, el movimiento ve menos. Un shunt bueno es un atajo fácil.",
          "Voltímetro. Se engancha al lado. Preguntar «¿lleva gafas?» no debería cambiar quién es el personaje.",
          "Ohmímetro. Fondo de escala es cansancio cero. Pregunta con una pila interna, nunca con el palacio encendido.",
          "Mide de mentira la rampa con los tres. Di dónde se sienta cada detective."
        ],
        hint: ["Pon Operation en la fila.", "Pon Guess Who al lado.", "Encaja en Perfection con el palacio apagado.", "Siéntalos en la rampa."],
        q: { text: "Si el atajo del amperímetro se pone más pegajoso, ¿el movimiento ve más desfile o menos?", opts: ["Más desfile", "Menos desfile"], ok: 1, good: "Menos. Un reloj goloso estorba.", bad: "Pinzas pegajosas: el desfile se queja y ve menos." }
      }
    ]
  },
  {
    n: 8, roman: "VIII", title: "Los disfraces y los mapas",
    concept: "A veces es más fácil pensar en un tesoro que manda empujón. A veces, en uno que manda desfile. Se puede cambiar de disfraz. El diamante, si está justo, no manda a nadie por en medio.",
    tuts: [
      {
        id: "8.1", kind: "isource", title: "El tesoro que manda desfile",
        pov: "La fuente de corriente. Impone las canicas; el tobogán lo fija la red.",
        toys: "Code-a-pillar · Hot Wheels en rampa · dosificador Grapat · Play-Doh",
        why: "Code-a-pillar camina igual sobre liso y arrugado. El Hot Wheels en la rampa sí se para si pones un tapón.",
        say: [
          "Code-a-pillar programa tres segmentos. Camina igual sobre la alfombra lisa y sobre el silk arrugado. El desfile lo impone él.",
          "El dosificador suelta una canica por segundo sobre un tapón blando y luego sobre uno seco. El desfile no cambia. Cambia la altura a la que se amontonan.",
          "Contraste: el Hot Wheels en la rampa. Si pones un tapón al final, el coche se para. Esa es fuente de empujón.",
          "Si el pasillo escondido es muchísimo más pegajoso que la carga, la fuente de verdad se parece a la ideal."
        ],
        hint: ["Haz caminar al gusanito sobre liso y arrugado.", "Cambia el tapón bajo el dosificador.", "Tapa el final de la rampa.", "Compara los dos tesoros."],
        q: { text: "Si una fuente manda desfile y tú cambias el tapón de carga, ¿el desfile se queda o cambia?", opts: ["Se queda; el tobogán lo fija la red", "Cambia el desfile"], ok: 0, good: "Se queda. El desfile lo impone él; el tobogán lo fija la red.", bad: "Fuente de desfile: las canicas no cambian; cambia la altura." }
      },
      {
        id: "8.2", kind: "disguise", title: "Cambiar de disfraz",
        pov: "Conversión Thévenin ↔ Norton. La carga de afuera no se entera.",
        toys: "Transformers · Potato Head · dos cajas Maileg · un Nin de carga",
        why: "Hacia fuera, el juguete hace lo mismo. El disfraz vale hacia fuera de los dos bornes, no adentro.",
        say: [
          "Transformers: el niño de afuera ve un coche o un robot. Hacia fuera hace lo mismo: llega a la misma silla.",
          "Potato Head: le cambias los brazos. Si la puerta sigue saludando igual, el resto del palacio no se redibuja.",
          "Dos cajas. El Nin-carga se sienta delante de cada una y recibe el mismo desfile. Adentro, una es tesoro más pasillo en fila; la otra, tesoro de desfile con pasillo al lado.",
          "Un convertidor que hace de red y uno que sigue a la red son duales: el cable es el mismo pasillo."
        ],
        hint: ["Transforma el robot.", "Cambia los brazos de la papa.", "Sienta al Nin delante de cada caja.", "Mira que afuera no se entera."],
        q: { text: "Si cambias el disfraz, ¿la carga de afuera se entera o no se entera?", opts: ["Se entera", "No se entera"], ok: 1, good: "No se entera. El disfraz vale hacia fuera.", bad: "Thévenin y Norton, hacia fuera, son el mismo saludo." }
      },
      {
        id: "8.3", kind: "mesh", title: "Círculos o casas",
        pov: "Mallas contra nudos. El mismo mapa, otra cuenta.",
        toys: "Connetix de dos huecos · Battleship · Kapla de tres caminos · canicas de tres colores",
        why: "Por círculos se restan las paredes compartidas. Por casas se cuentan alturas.",
        say: [
          "Cada hueco Connetix es una malla. Una canica-desfile por círculo. La pared compartida se resta.",
          "Si una fuente de desfile está en la pared común, los dos círculos se unen: supermalla.",
          "Por casas: cada casilla no-tierra es una altura. El mar del tablero es tierra.",
          "Mismo palacio de tres ramas. Cuéntalo primero con dos círculos, luego con dos casas. El Nin llega al mismo sitio."
        ],
        hint: ["Marca los dos huecos.", "Mira la pared compartida.", "Juega una casilla de Battleship como altura.", "Cuenta las tres ramas de las dos maneras."],
        q: { text: "Si dos círculos comparten un tapón, ¿ese tapón se suma o se resta en la cuenta de cada uno con el otro?", opts: ["Se suma", "Se resta"], ok: 1, good: "Se resta. El cansancio compartido lleva signo menos.", bad: "La pared compartida se resta." }
      },
      {
        id: "8.4", kind: "diamond", title: "El diamante que no manda a nadie por en medio",
        pov: "El puente equilibrado. Y el trébol y el triángulo.",
        toys: "Connetix diamante · Connect 4 de punta · UNO 5, 5, 10, 20 · canicas",
        why: "Productos iguales: la diagonal no lleva desfile. Una pastilla débil desequilibra el diamante.",
        say: [
          "Arma el diamante. Cartas 5 y 20 en un cruce, 5 y 10 en el otro. 5×20=100, 5×10=50. No está equilibrado. La canica pasa por la diagonal.",
          "Cambia a 5, 5, 10, 10. Productos iguales. La diagonal no lleva desfile. La canica se queda quieta en el medio.",
          "Eso es una pastilla débil o una tira con sombra: el diamante se desequilibra y la diagonal se queja.",
          "Traduce el diamante a un trébol: tres caminos a un nudo común. Equilibrio: el producto de un cruce iguala el del otro."
        ],
        hint: ["Pon 5, 20, 5, 10 y suelta una canica.", "Cambia a 5, 5, 10, 10.", "Mira la diagonal quieta.", "Arma un trébol Kapla."],
        q: { text: "Si el diamante está equilibrado, ¿por la diagonal pasan muchas canicas, poquitas, o ninguna?", opts: ["Muchas", "Poquitas", "Ninguna"], ok: 2, good: "Ninguna. Productos iguales: la diagonal no manda a nadie.", bad: "Equilibrado: la canica del medio no quiere ir." }
      }
    ]
  },
  {
    n: 9, roman: "IX", title: "Los trucos del palacio",
    concept: "No cambian el palacio. Cambian el modo de mirarlo. Se apaga uno y se mira el otro. El mejor tesoro llega cuando el tapón iguala al pasillo. El eco es justo.",
    tuts: [
      {
        id: "9.1", kind: "super", title: "Encender un tesoro a la vez",
        pov: "Superposición. Vale para desfile y empujón. No vale para el calor.",
        toys: "Dos linternas o dos coches · palacio Connetix · canicas de dos colores · Play-Doh que se calienta",
        why: "El desfile se suma. El calor de las dos manos juntas no es la suma: hay términos cruzados.",
        say: [
          "Tesoro A encendido, tesoro B puenteado. Cuenta las canicas de color A.",
          "Tesoro B encendido, tesoro A abierto o puenteado según su tipo. Cuenta las de color B. Suma.",
          "Enciende los dos a la vez. El desfile en ese punto es la suma. Superposición.",
          "Ahora el calor: amasa con una mano, luego con la otra, luego con las dos. El calor no se superpone."
        ],
        hint: ["Enciende solo A.", "Enciende solo B.", "Enciende los dos.", "Amasa el churro con las dos manos."],
        q: { text: "Si apagas un tesoro de empujón, ¿lo sustituyes por un puente o por un abierto?", opts: ["Por un puente", "Por un abierto"], ok: 0, good: "Por un puente. Un tesoro de desfile, por un abierto.", bad: "Empujón apagado = puente. Desfile apagado = abierto." }
      },
      {
        id: "9.2", kind: "box", title: "La cajita de dos bornes",
        pov: "Thévenin, y su primo Norton. Lo que ve la carga al pincharse.",
        toys: "Caja Maileg o Moulin Roty · ratón y tela · Nin-carga · Magic 8 Ball",
        why: "La carga no tiene permiso de abrir la caja. Solo pincha dos bornes.",
        say: [
          "La carga no abre la caja. Solo pincha dos bornes.",
          "Con la caja Thévenin, el desfile de la carga es el tesoro partido por (pasillo + tapón).",
          "Cambia a Norton. La carga ve lo mismo. El primo manda desfile; la cajita manda empujón; afuera no se nota.",
          "Magic 8 Ball: dos bornes. Adentro hay un cubo. Hacia fuera, una cajita. No hace falta redibujar el cuarto."
        ],
        hint: ["No abras la caja.", "Engancha el Nin-carga.", "Cambia el disfraz de adentro.", "Agita la 8 Ball: ves la respuesta, no el cubo."],
        q: { text: "Si la cajita tiene un tesoro y un pasillo, y tú enganchas un tapón, ¿el desfile lo decide solo el tesoro o los dos juntos?", opts: ["Solo el tesoro", "Los dos juntos"], ok: 1, good: "Los dos juntos: tesoro partido por (pasillo + tapón).", bad: "El pasillo de la cajita también cuenta." }
      },
      {
        id: "9.3", kind: "match", title: "El mejor tesoro",
        pov: "Máxima transferencia. El tapón igual al pasillo.",
        toys: "Balanza PlanToys · cajita con pasillo de 4 · cargas 1, 2, 4, 8 · Monopoly · Jenga",
        why: "La curva sube y baja. El bloque que sale mejor no es el más suelto ni el más preso.",
        say: [
          "Fija el pasillo de la cajita en 4. Engancha carga 1: llega poco tesoro. El pasillo se come casi todo.",
          "Carga 2: más tesoro. Carga 4: máximo. Carga 8: otra vez menos.",
          "Un cuarto, la mitad, uno, el doble. La curva sube y baja.",
          "Jenga: el bloque que sale mejor iguala lo que la torre puede dar. El tesoro máximo cae fuera de ese punto."
        ],
        hint: ["Prueba carga 1.", "Prueba 2, 4 y 8.", "Mira cuál equilibra la balanza.", "Saca el bloque justo de Jenga."],
        q: { text: "Si el tapón de carga es el doble del pasillo de la cajita, ¿llega el tesoro máximo o menos?", opts: ["El máximo", "Menos"], ok: 1, good: "Menos. El máximo es cuando el tapón iguala al pasillo.", bad: "Fuera de la igualdad, el tesoro cae." }
      },
      {
        id: "9.4", kind: "echo", title: "El eco es justo",
        pov: "Reciprocidad. Y Millman y la sustitución.",
        toys: "Simon · puente Connetix · Potato Head · tres linternas con tres pasillos",
        why: "El palacio no tiene puerta preferida. Un pulso de ensayo y la lectura, o al revés, dan el mismo eco.",
        say: [
          "Simon: tú tocas, él responde; luego él toca, tú respondes. El palacio no tiene favorito.",
          "Suelta una canica en A, cuenta las que llegan a B. Muda el tesoro a B, cuenta en A. Mismo número si el palacio es lineal.",
          "Potato Head: cambias un trozo por otro de la misma puerta. El resto no se entera. Teorema de sustitución.",
          "Tres linternas en paralelo, cada una con su tela. El tobogán es un acuerdo. La de pasillo más fácil tiene más voz. Millman."
        ],
        hint: ["Juega una ronda de Simon.", "Suelta en A, luego en B.", "Cambia la nariz de la papa.", "Enciende las tres linternas."],
        q: { text: "Si el eco es el mismo al mudarse, ¿el palacio tiene un favorito entre la puerta y la tira, o es justo?", opts: ["Tiene un favorito", "Es justo"], ok: 1, good: "Es justo. El palacio no tiene puerta preferida.", bad: "Reciprocidad: el eco no elige favorito." }
      }
    ]
  },
  {
    n: 10, roman: "X", title: "El cubo que no olvida el tobogán",
    concept: "Dos bandejas cercanas, un abrigo en medio. El cubo no guarda desfile: guarda empujón. Tau es el pasillo por lo gordo del cubo. El tesoro crece con el tobogán al cuadrado.",
    tuts: [
      {
        id: "10.1", kind: "cap", variant: "plates", title: "Dos bandejas y un viento",
        pov: "Capacitancia. Más bandeja, más juntas, más abrigo especial: más cubo.",
        toys: "Balanza PlanToys · Sarah’s Silks · canicas · esferas TickiT · dos telas",
        why: "Las bandejas de la balanza son el cubo. El silk es el abrigo. No debe romperse.",
        say: [
          "Las dos bandejas, cerca. El viento es el empujón partido por la distancia. Aléjalas: el viento se pone más manso.",
          "Pon el playsilk en medio. Eso es el abrigo. Si aprietas demasiado, el abrigo se queja: voltaje de ruptura.",
          "Llena una bandeja de canicas. Capacitancia es cuántos paquetes guarda por cada piso de tobogán. Bandejas más grandes: más cubo.",
          "Cambia el abrigo: una tela, luego dos. El techo de empujón sube."
        ],
        hint: ["Aleja las bandejas.", "Pon el silk en medio.", "Llena de canicas.", "Dobla la tela."],
        q: { text: "Si alejas las dos bandejas, ¿el viento entre ellas se pone más bravo o más manso?", opts: ["Más bravo", "Más manso"], ok: 1, good: "Más manso. El viento es empujón partido por distancia.", bad: "Más lejos, viento más manso." }
      },
      {
        id: "10.2", kind: "tau", variant: "C", title: "Llenar despacio, vaciar despacio",
        pov: "Tau. A un tau, el 63 %. A cinco, se da por lleno. El cubo no olvida de dónde partía.",
        toys: "Luggy o cuenco grande · Fun Factory · canicas · reloj · Don’t Break the Ice · silk",
        why: "De una en una es precarga educada. Un vuelco brutal es el chispazo.",
        say: [
          "Precarga educada: las canicas caen de una en una. Al principio caen más de prisa; al final el cuenco está lleno y ya no caben.",
          "Marca a ojo el 63 % (un tau) y el «lleno» (cinco taus). Si el embudo se hace más pegajoso, el cubo se llena más despacio.",
          "Vaciar educado: boca ancha, de prisa y aún educado. Un vuelco brutal es Don’t Break the Ice: chispazo, no bleeder.",
          "El cubo no olvida: deja tres canicas dentro, «cierra a diez». La curva parte de tres, no de cero."
        ],
        hint: ["Deja caer canicas de una en una.", "Aprieta el embudo para hacer tau más largo.", "No vuelques: eso es chispazo.", "Deja tres dentro y sigue."],
        q: { text: "Si el pasillo del precargador se hace más pegajoso, ¿el cubo se llena más de prisa o más despacio?", opts: ["Más de prisa", "Más despacio"], ok: 1, good: "Más despacio. Tau es el pasillo por lo gordo del cubo.", bad: "Embudo más pegajoso: tau más largo." }
      },
      {
        id: "10.3", kind: "cap", variant: "bank", title: "Cubos juntos",
        pov: "Paralelo suma; serie, al revés. Sin balance, el abrigo desigual se come el margen.",
        toys: "Tres cuencos iguales y uno chico · canicas · arcoíris Grimm’s · Kapla de balance",
        why: "Un banco de camino gordo es paralelo para el desfile, con series para el empujón.",
        say: [
          "Paralelo. Dos cuencos iguales lado a lado, mismo tobogán. Los paquetes se parten. El cubo total es el doble.",
          "Serie. Un cuenco encima de otro. El mismo paquete tiene que pagar dos toboganes. El cubo total es la mitad.",
          "Pon el cuenco chico en serie con el grande, sin balance. El chico se llena antes. Añade un listón de balance.",
          "En reposo, los cubos se comportan como abiertos: el tobogán lo fijan los tapones."
        ],
        hint: ["Llena dos cuencos lado a lado.", "Pon uno encima del otro.", "Usa el cuenco chico sin balance.", "Añade el listón Kapla."],
        q: { text: "Si pones dos cubos iguales en paralelo, ¿el cubo total es el doble o la mitad?", opts: ["El doble", "La mitad"], ok: 0, good: "El doble. Paralelo suma.", bad: "Lado a lado, mismo tobogán: el cubo se duplica." }
      },
      {
        id: "10.4", kind: "sq", variant: "C", title: "El tesoro escondido al cuadrado",
        pov: "Energía del capacitor. Mitad del cubo por el tobogán al cuadrado.",
        toys: "Balanza · cuencos y canicas · Monopoly · arco Grimm’s como flash · reloj",
        why: "Duplicar altura, cuatro veces tesoro. El flash vuelca el cuenco alto en medio segundo.",
        say: [
          "Llena un cuenco a altura 1. El tesoro es 1 moneda.",
          "Misma cubeta, altura 2. No pongas 2 monedas: pon 4. El tesoro crece con el tobogán al cuadrado.",
          "Duplica el cubo (dos cuencos) a altura 1: 2 monedas. El cubo entra lineal; el tobogán, al cuadrado.",
          "El flash: vuelca el cuenco alto de golpe. Mismos bocados, otra rapidez. Recarga educada: de una en una."
        ],
        hint: ["Llena a altura 1.", "Llena a altura 2: cuatro monedas.", "Pon dos cuencos a altura 1.", "Vuelca de golpe, luego recarga despacio."],
        q: { text: "Si duplicas el tobogán y dejas el cubo igual, ¿el tesoro escondido se hace el doble o cuatro veces?", opts: ["El doble", "Cuatro veces"], ok: 1, good: "Cuatro veces. El tesoro crece con el tobogán al cuadrado.", bad: "Altura al cuadrado: 2×2=4." }
      }
    ]
  },
  {
    n: 11, roman: "XI", title: "El río invisible del hierro",
    concept: "Un río de líneas de imán. Corre por el hierro, se aprieta en los cuellos, se queja en los huequitos de aire. Las vueltas de un ovillo lo empujan. El hierro tiene memoria.",
    tuts: [
      {
        id: "11.1", kind: "flux", title: "El río y el cuello",
        pov: "Densidad de flujo. El mismo río, un cuello más flaco: más tesla.",
        toys: "Sarah’s Silks · Ostheimer o Nins · Kapla · varitas TickiT · canicas",
        why: "En el cauce ancho las líneas van holgadas. En el cuello, se aprietan.",
        say: [
          "El silk es el río. En el cauce Kapla ancho, las canicas-líneas van holgadas. En el cuello, se aprietan. Misma cantidad, más densidad.",
          "La varita: acerca clips en un plato hondo y luego en un vaso estrecho. En el vaso se amontonan más juntos. Supervisa: los imanes no se llevan a la boca.",
          "Regla de la mano derecha, jugada: el pulgar es el norte del núcleo. El resto de los dedos, el desfile del ovillo.",
          "Si el cuello se llena del todo, las canicas ya no caben: satura. El ovillo ya no sube."
        ],
        hint: ["Pasa canicas por el cauce ancho y por el cuello.", "Acerca la varita al vaso estrecho.", "Pon el pulgar al norte.", "Llena el cuello hasta que no quepan."],
        q: { text: "Si el mismo río se aprieta en un cuello más flaco, ¿la densidad sube o baja?", opts: ["Sube", "Baja"], ok: 0, good: "Sube. Un tesla es un weber por metro cuadrado.", bad: "Mismo río, menos ancho: más densidad." }
      },
      {
        id: "11.2", kind: "gap", title: "El huequito se come el empujón",
        pov: "Reluctancia. El aire es un pasillo magnético a propósito.",
        toys: "Anillo Connetix o ferrocarril · un huequito · varita TickiT · Play-Doh",
        why: "Un milímetro de aire se come más empujón que un metro de acero.",
        say: [
          "Anillo cerrado. La varita arrastra un clip alrededor con facilidad. El hierro es fácil.",
          "Abre un huequito. El clip se queja, se para, hay que empujar más.",
          "Por eso el ovillo de un boost lleva huequito: endereza el ovillo y aguanta el desfile quieto. El relé es el mismo huequito, ahora móvil.",
          "Reluctancia es lo largo partido por lo fácil del material y por lo ancho."
        ],
        hint: ["Cierra el anillo y arrastra un clip.", "Quita una baldosa.", "Abre y cierra con la mano: relé.", "Haz el huequito más gordito."],
        q: { text: "Si el huequito se hace más gordito, ¿hace falta más empujón de vueltas o menos, para el mismo río?", opts: ["Más empujón", "Menos empujón"], ok: 0, good: "Más empujón. El aire se come el río.", bad: "Más aire, más difícil: más vueltas para el mismo río." }
      },
      {
        id: "11.3", kind: "ohm", variant: "hopkinson", title: "Vueltas por desfile",
        pov: "Hopkinson, el dual de Ohm. El río es el empujón de vueltas partido por lo difícil.",
        toys: "Ovillos de lana · tubo o Kapla · Georello · tres ratones Maileg · canicas",
        why: "Las recetas no cambiaron. Cambió el río.",
        say: [
          "Enrolla 5 vueltas. Enrolla 10. Con el mismo tirón, el de 10 vueltas empuja más el río.",
          "Los tres amigos otra vez, pero primos: Empujón-de-vueltas, Río, Difícil. Si enrollas más vueltas y lo difícil se queda, el río se hace más gordo.",
          "Ampere-vuelta: desfile por número de vueltas. «Dos amperios por diez vueltas, veinte empujones».",
          "En el huequito hace falta más empujón por paso que en el acero para el mismo río apretado."
        ],
        hint: ["Enrolla 5, luego 10.", "Nombra a los tres primos.", "Cuenta en voz alta las vueltas.", "Compara el huequito con el anillo cerrado."],
        q: { text: "Si enrollas más vueltas con el mismo desfile, ¿el río se hace más gordo o más flaco, si lo difícil se queda igual?", opts: ["Más gordo", "Más flaco"], ok: 0, good: "Más gordo. Es Hopkinson, el dual de Ohm.", bad: "Más vueltas, mismo desfile: más río." }
      },
      {
        id: "11.4", kind: "memory", title: "El hierro no va y vuelve por la misma raya",
        pov: "Histéresis y saturación. Memoria. Pérdidas en vacío.",
        toys: "Play-Doh ya usado · Twister · Simon · ovillo enrollado · Jenga tocada",
        why: "Ir y volver por caminos distintos. Eso son las pérdidas en vacío.",
        say: [
          "Estira Play-Doh y suéltalo. No vuelve del todo. El acero satura y recuerda.",
          "Twister: el pie va al rojo por un camino; al volver al neutro, el cuerpo pasa por otro. Histéresis es el retraso.",
          "Satura: cuando el Play-Doh ya no da más de sí, enrollar más vueltas casi no engorda el río.",
          "Un transformador de hoy se compra por lo que pierde, no por el nombre del metal."
        ],
        hint: ["Estira y suelta la pasta.", "Ve a un color de Twister y vuelve.", "Enrolla de más: ya no da.", "Mira la torre Jenga que ya se tocó."],
        q: { text: "Si el hierro satura, ¿enrollar más vueltas sigue engordando el río igual, o ya casi no?", opts: ["Sigue igual", "Ya casi no"], ok: 1, good: "Ya casi no. El Play-Doh no da más de sí.", bad: "Saturado: más vueltas casi no engordan el río." }
      }
    ]
  },
  {
    n: 12, roman: "XII", title: "El ovillo que no olvida el desfile",
    concept: "El ovillo es el primo del cubo. El cubo no deja que el tobogán salte. El ovillo no deja que el desfile salte. Si el río cambia, habla. El eco se opone: Lenz.",
    tuts: [
      {
        id: "12.1", kind: "tau", variant: "L", title: "El desfile no salta",
        pov: "El dual del cubo. Tau es el ovillo partido por el pasillo. Parte de donde iba.",
        toys: "Ovillo de lana grande · Hot Wheels Super Loop · Code-a-pillar · reloj HABA",
        why: "El coche no puede estar a la vez parado y a toda prisa. Hay una rampa.",
        say: [
          "Tira del hilo. El desfile no pasa de cero a mucho en un instante: el ovillo se queja, se desbobina con tau.",
          "Si el ovillo es más gordo y el pasillo se queda, el desfile llega más despacio. A un tau, el 63 %; a cinco, magnetizado.",
          "El ovillo no olvida: deja un trozo de hilo ya salido y sigue. Un choke con sesgo.",
          "Contraste con el cubo: allí no saltaba el tobogán. Aquí no salta el desfile. Primas."
        ],
        hint: ["Tira despacio del ovillo.", "Usa un ovillo más gordo.", "Deja hilo ya salido y sigue.", "Compara con el cubo del piso 10."],
        q: { text: "Si el ovillo es más gordo y el pasillo se queda igual, ¿el desfile llega más de prisa o más despacio a su sitio?", opts: ["Más de prisa", "Más despacio"], ok: 1, good: "Más despacio. Tau es el ovillo partido por el pasillo.", bad: "Ovillo más gordo: el desfile llega más tarde." }
      },
      {
        id: "12.2", kind: "lenz", title: "El eco se opone",
        pov: "Faraday y Lenz. Si el río se queda quieto, el ovillo se calla. Si cambia, habla en contra.",
        toys: "Ovillo y un Nin atado · Georello · Simon · playsilk que ondeas",
        why: "Quieto, calla. Cambiando, habla. Un weber por segundo en una vuelta es un voltio.",
        say: [
          "El río (el silk) quieto: el ovillo no habla. El Nin no se mueve.",
          "Ondea el silk de prisa: el Nin salta hacia atrás, contra el tirón. Lenz: el eco se opone a la causa.",
          "Faraday: el empujón es vueltas por lo de prisa que cambia el río. Más vueltas, más habla. Más prisa, más habla.",
          "Si paras los engranajes de golpe, el último se queja. Si el desfile se queda quieto, no hay empujón en el ovillo."
        ],
        hint: ["Deja el silk quieto.", "Ondea de prisa.", "Enrolla más vueltas.", "Para los engranajes de golpe."],
        q: { text: "Si el río se queda quieto, ¿el ovillo habla o se calla?", opts: ["Habla", "Se calla"], ok: 1, good: "Se calla. Quieto, calla; cambiando, habla.", bad: "Río quieto: el ovillo no dice nada." }
      },
      {
        id: "12.3", kind: "freewheel", title: "El camino amigo",
        pov: "Rueda libre. Abrir sin camino es chispazo. El desfile se desvía, no se interrumpe.",
        toys: "Ovillo · arco Grimm’s · Operation · KerPlunk · Waytoplay desvío",
        why: "Sin camino amigo, abrir era un chispazo. El desfile del choke no se interrumpe, se desvía.",
        say: [
          "Tira del ovillo. Cierra el camino con la mano. Si no hay desvío, el hilo se tensa de golpe: chispazo. Simúlalo y páralo.",
          "Pon el arco como rueda libre: al cerrar la vía, el hilo se va por el arco y el desfile continúa. El diodo amigo.",
          "Operation: el buzz es el chispazo de haber abierto sin colchón. KerPlunk: el último palito es abrir a cinco taus.",
          "En el río quieto, el ovillo se parece a un puente y el cubo a un abierto."
        ],
        hint: ["Tira y cierra sin desvío —con cuidado.", "Pon el arco-amigo.", "Escucha el buzz de Operation.", "Saca el último palito de KerPlunk."],
        q: { text: "Si abres el camino del ovillo y no le dejas un camino amigo, ¿el empujón se queda educado o se dispara?", opts: ["Se queda educado", "Se dispara"], ok: 1, good: "Se dispara. Sin camino amigo, abrir era un chispazo.", bad: "Sin desvío, el hilo se tensa de golpe." }
      },
      {
        id: "12.4", kind: "sq", variant: "L", title: "El tesoro del ovillo y los ovillos juntos",
        pov: "½ L I². Serie suma; paralelo, al revés. Dual del cubo.",
        toys: "Dos ovillos iguales y uno más gordo · Monopoly · Luggy · balanza · un cuenco-cubo",
        why: "Al cuadrado, otra vez. El camino amigo se dimensiona con esos bocados.",
        say: [
          "Un ovillo, desfile «1». Tesoro: 1 moneda. Mismo ovillo, desfile «2». Tesoro: 4 monedas.",
          "Serie: dos ovillos, el mismo hilo los cruza. El ovillo total es el doble.",
          "Paralelo: dos ovillos lado a lado, el hilo se parte. El ovillo total es la mitad.",
          "Palacio quieto: el desfile continuo pasa por el ovillo (puente); el cubo guarda tobogán y no conduce."
        ],
        hint: ["Tira un brazo, luego dos.", "Pon dos ovillos en serie.", "Ponlos lado a lado.", "Deja el palacio quieto: ovillo puente, cubo abierto."],
        q: { text: "Si duplicas el desfile y dejas el ovillo igual, ¿el tesoro escondido se hace el doble o cuatro veces?", opts: ["El doble", "Cuatro veces"], ok: 1, good: "Cuatro veces. El tesoro crece con el desfile al cuadrado.", bad: "Desfile al cuadrado: 2×2=4." }
      }
    ]
  },
  {
    n: 13, roman: "XIII", title: "El columpio",
    concept: "Un vaivén. Un ciclo es un ida y vuelta. El promedio de un columpio puro es cero. El calor de verdad es el RMS, no el pico.",
    tuts: [
      {
        id: "13.1", kind: "swing", variant: "period", title: "El vaivén y la rueda",
        pov: "Periodo, frecuencia, radianes. Si va más de prisa, el periodo se acorta.",
        toys: "Columpio o tela · peonzas Grimm’s · xilófono · reloj HABA · Simon",
        why: "Un ciclo de red es veinte milisegundos a cincuenta hertz. El convertidor se engancha a esa rueda.",
        say: [
          "Un vaivén completo es un ciclo. Cuenta diez. Cronometra. Periodo es lo que tarda uno. Frecuencia es cuántos en un segundo.",
          "Empuja más de prisa. El periodo se hace más corto. Frecuencia sube.",
          "La peonza: una vuelta completa son «dos pi». Si da más vueltas por segundo, la rueda gira más rabiosa.",
          "Xilófono: una tecla grave es pocos vaivenes; una aguda, muchos. El mismo columpio, otra música."
        ],
        hint: ["Empuja el columpio y cuenta.", "Empuja más de prisa.", "Lanza la peonza.", "Toca una tecla grave y una aguda."],
        q: { text: "Si el columpio va más de prisa, ¿el periodo se hace más largo o más corto?", opts: ["Más largo", "Más corto"], ok: 1, good: "Más corto. Más prisa, menos espera entre vaivenes.", bad: "Más frecuencia, periodo más corto." }
      },
      {
        id: "13.2", kind: "swing", variant: "phase", title: "Quién va primero",
        pov: "El desfase. Adelantar, retrasar. El coseno es un seno corrido noventa grados.",
        toys: "Twister · dos columpios o un silk · Simon · dos peonzas",
        why: "El pico es el mismo; la rueda, la misma; cambia el desfase.",
        say: [
          "Twister: una mano en rojo antes que el pie en azul. La mano adelanta. El pie retrasa.",
          "Dos vaivenes: empujón y desfile. Si el silk llega después, el desfile retrasa. Si el empujón adelanta al desfile, el cubo está haciendo de cubo.",
          "Coseno = seno que salió un cuarto de rueda antes. Juega a salir a las doce y a las tres.",
          "Un signo menos es media rueda: salir hacia el otro lado."
        ],
        hint: ["Pon la mano antes que el pie.", "Ondea el silk después del columpio.", "Sal a las doce y a las tres.", "Sal al otro lado."],
        q: { text: "Si el desfile llega después que el empujón, ¿el desfile adelanta o retrasa?", opts: ["Adelanta", "Retrasa"], ok: 1, good: "Retrasa. Llegar después es retrasar.", bad: "Después = retraso." }
      },
      {
        id: "13.3", kind: "swing", variant: "avg", title: "El promedio es cero",
        pov: "El área de arriba iguala el área de abajo. Si no, hay un río quieto escondido.",
        toys: "Columpio o silk simétrico · balanza · canicas · un cojín · Monopoly",
        why: "Un columpio puro no mueve un watt-hora quieto. Un cojín es inyección.",
        say: [
          "Cada vez que el columpio pasa del medio hacia adelante, una canica al platillo A. Hacia atrás, al B. Al cabo de diez ciclos, la balanza empata. Promedio cero.",
          "Pon el cojín: el columpio ya no baja igual. El platillo A gana. Hay un piso escondido.",
          "Un pulso, un triángulo, un escalón: no todos promedian cero.",
          "Pasar de río quieto a columpio resta el promedio y recentra: el cubo de acoplo, no un trueno."
        ],
        hint: ["Cuenta idas y vueltas en la balanza.", "Pon el cojín.", "Prueba un pulso que no baja.", "Quita el promedio: recentra."],
        q: { text: "Si un columpio es igual de alto arriba y abajo, ¿el promedio es el pico, la mitad, o cero?", opts: ["El pico", "La mitad", "Cero"], ok: 2, good: "Cero. El área de arriba iguala el área de abajo.", bad: "Simétrico: promedio cero, no el pico." }
      },
      {
        id: "13.4", kind: "rms", title: "El calor de verdad no es el pico",
        pov: "RMS. El abrigo se compra contra el pico; el medidor factura el RMS.",
        toys: "Play-Doh dos churros · Operation · Simon · monedas",
        why: "Un cuatrocientos RMS tiene pico de quinientos sesenta y seis. Un reloj barato se deja engañar por un trino.",
        say: [
          "Amasa un churro con presión constante. Calor de río quieto. Amasa el otro a vaivenes, mismo pico, pero sueltas a medias. El segundo se calienta menos.",
          "El pico no era el calor. El calor de verdad es el RMS: el río quieto que produciría el mismo calor.",
          "Para un columpio, RMS es un poco más de dos tercios del pico, siete de cada diez. El abrigo se compra contra el pico. La factura, contra el RMS.",
          "Operation (el barato) se queja solo cuando tocas. Simon a toda prisa lo engaña. Un true-RMS no."
        ],
        hint: ["Amasa sin parar, luego a vaivenes.", "Compara el calor de los dos churros.", "Mira el pico y el RMS.", "No te fíes del reloj barato con un trino."],
        q: { text: "Si un columpio dice cuatrocientos RMS, ¿el abrigo tiene que aguantar cuatrocientos, o más?", opts: ["Cuatrocientos", "Más"], ok: 1, good: "Más. El abrigo se compra contra el pico, que es mayor que el RMS.", bad: "Cuatrocientos RMS tiene pico de unos quinientos sesenta y seis." }
      }
    ]
  },
  {
    n: 14, roman: "XIV", title: "La foto del columpio",
    concept: "Si todos los columpios van a la misma rueda, basta una foto: módulo y ángulo. Esa foto se llama fasor. Solo se factura el tesoro en fase. El mapa tiene dos calles, o una flecha.",
    tuts: [
      {
        id: "14.1", kind: "photo", title: "La pendiente y la foto",
        pov: "La derivada es máxima al cruzar cero y nula en el pico. El fasor es la foto a tiempo cero.",
        toys: "Columpio · cámara PlanToys · View-Master · peonza · un papel",
        why: "Si dos columpios van a ruedas distintas, no puedes sumarlos con una sola foto.",
        say: [
          "En el pico (lo más alto), un instante no subes ni bajas. Pendiente cero. Al cruzar el medio, la pendiente es máxima.",
          "Empuja más de prisa: la pendiente se agranda. Lo de prisa de un grifo a cincuenta kilohertz no es lo de un molino a cincuenta hertz.",
          "Saca una foto cuando el columpio cruza el medio hacia adelante. Esa foto es el fasor: una flecha de largo y de ángulo.",
          "View-Master: otra foto, otro ángulo. Si dos columpios van a ruedas distintas, cada rueda pide la suya."
        ],
        hint: ["Fíjate en el pico: no subes ni bajas.", "Empuja más de prisa.", "Toma la foto al cruzar el medio.", "Mira otra foto con el View-Master."],
        q: { text: "En el pico del columpio, ¿la pendiente es máxima o cero?", opts: ["Máxima", "Cero"], ok: 1, good: "Cero. En el pico un instante no subes ni bajas.", bad: "Pendiente máxima al cruzar el medio, no en el pico." }
      },
      {
        id: "14.2", kind: "rlc", title: "Tres amigos en el columpio",
        pov: "R, L, C a senoidal. El tapón sale a la vez. El ovillo adelanta el empujón. El cubo adelanta el desfile.",
        toys: "Tres Maileg · xilófono · ovillo · cuenco-cubo · churro Play-Doh · Twister",
        why: "A más música, el ovillo se pone más pegajoso y el cubo más fácil.",
        say: [
          "Tapón. Empujón y desfile salen a la vez. El ratón Tapón y su canica cruzan el medio juntos.",
          "Ovillo. El empujón adelanta noventa: el ratón llega al pico cuando el desfile cruza cero. A más música, más pegajoso.",
          "Cubo. El desfile adelanta noventa. A más música, más fácil. El cubo del camino a cero hertz no deja pasar; a la portadora, es un puente.",
          "Donde los dos cansancios de columpio se igualan: resonancia. En el xilófono, la tecla que llena el cuarto."
        ],
        hint: ["Haz salir juntos a Tapón y su canica.", "Adelanta al ratón Ovillo noventa.", "Adelanta las canicas del cubo.", "Busca la tecla que llena el cuarto."],
        q: { text: "Si subes la frecuencia, ¿el cubo se pone más fácil o más difícil para las canicas del columpio?", opts: ["Más fácil", "Más difícil"], ok: 0, good: "Más fácil. A más música, el cubo es un puente.", bad: "Más hertz, cubo más fácil; ovillo más pegajoso." }
      },
      {
        id: "14.3", kind: "bill", title: "Solo se factura lo que va a la vez",
        pov: "Potencia promedio. RMS × RMS × coseno del ángulo. El ovillo y el cubo ideales no facturan.",
        toys: "Caja registradora · Monopoly · Twister · tres Maileg · Life Junior",
        why: "Ángulo cero: se factura todo. Ángulo noventa: se presta y se devuelve. El cajero no cobra.",
        say: [
          "Empujón y desfile salen a la vez (ángulo cero): se factura todo el tesoro aparente. El tapón paga el producto de los dos RMS.",
          "Ángulo noventa (ovillo o cubo ideales): coseno cero. Se presta y se devuelve. Tesoro facturado cero.",
          "Ángulo a medias (factor 0,5 atrasado): se factura la mitad. El molino magnetizándose es el atrasado; el cubo del filtro, el adelantado.",
          "El convertidor de hoy entrega tesoro de lado cuando la red lo pide. El número de placa no es lo que se cobra siempre."
        ],
        hint: ["Salid a la vez: cobra todo.", "Salid a noventa: el cajero no cobra.", "Salid a medias: la mitad.", "Mira tres recetas en la caja."],
        q: { text: "Si empujón y desfile salen a la vez, ¿se factura todo el tesoro aparente, o nada?", opts: ["Todo", "Nada"], ok: 0, good: "Todo. Ángulo cero, coseno uno.", bad: "A la vez se factura todo; a noventa, nada." }
      },
      {
        id: "14.4", kind: "streets", title: "Dos calles o una flecha",
        pov: "Rectangular y polar. Sumar en las calles; multiplicar en las flechas. j es un giro de noventa.",
        toys: "Waytoplay dos calles · Connetix flechas · Battleship · cámara y View-Master · UNO",
        why: "El enganche del convertidor vive en polar. El cuaderno de mando suma en rectangular.",
        say: [
          "Un punto se puede decir con las dos calles (cuatro al este y tres al norte) o con una flecha (largo cinco, un poco hacia arriba).",
          "Si la flecha está toda en la calle de verdad y nada en la de lado, el ángulo es cero. Todo se factura.",
          "Sumar dos flechas: pásalas a las dos calles, suma calle con calle, vuelve a la flecha. Multiplicar, en flechas.",
          "j es girar noventa hacia la calle de lado. El ovillo vive hacia +j; el cubo, hacia −j."
        ],
        hint: ["Pon cuatro al este y tres al norte.", "Deja la flecha solo en la calle de verdad.", "Suma calle con calle.", "Gira noventa: eso es j."],
        q: { text: "Si una flecha está toda en la calle de verdad y nada en la de lado, ¿el ángulo es cero, noventa, o ciento ochenta?", opts: ["Cero", "Noventa", "Ciento ochenta"], ok: 0, good: "Cero. Todo se factura. Y para sumar dos flechas, pasa a las dos calles.", bad: "Calle de verdad sola: ángulo cero." }
      }
    ]
  }
];
