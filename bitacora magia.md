# Bitácora Magia — Diagnóstico y Prompts de Depuración (Pisos I al XIV · 56 Juegos)

Esta bitácora documenta el diagnóstico técnico de cada nivel de la sección **Magia (El taller del mago Vaelithor)** en `magia/floors.js` y `magia/magia.js`, junto con la secuencia completa de **prompts de ingeniería** listos para copiar, pegar y ejecutar paso a paso hasta dejar los **14 pisos (56 minijuegos interactivos en p5.js)** funcionando a 60 FPS y **sin pifias**.

---

## 1. Diagnóstico General de Pifias en el Motor (`magia/magia.js` y `magia/floors.js`)

Al auditar el código actual del árbol de trabajo frente al historial de `git HEAD` (`fde70e6`), se identificaron **6 pifias estructurales globales** que afectan a todos los niveles:

1. **Desincronización entre el Nivel Único de Vaelithor y los 14 Pisos Originales**:
   - En el árbol de trabajo actual, `magia/floors.js` y `magia/magia.js` fueron sobrescritos con un único piso (`powers_of_ten`: resistores de $2.000\ \Omega$ y $3.000.000\ \Omega$), dejando fuera los 14 pisos (56 tutoriales) presentes en `HEAD:magia/floors.js`.
2. **Conflicto crítico entre `clickable: true` y el arrastre (`onPress`)**:
   - En `HEAD:magia/magia.js` (línea 886): `if (pc.clickable) { clickPiece(pc); return; }` corta la ejecución antes de `dragging = pc`. Como resultado, cualquier pieza que tenga `clickable: true` (como las fichas de `bands` en 3.4, el `hippo`, o el `huequito` magnético en 11.2) **queda bloqueada y no se puede arrastrar**.
3. **Pérdida de propiedades `variant` en `floors.js`**:
   - El motor `magia.js` espera `w.variant` en múltiples juegos (`series`: `"identity"`, `"sum"`, `"fuse"`; `parallel`: `"easy"`, `"fuse"`; `ohm`: `"hopkinson"`; `cap`: `"bank"`; `tau`: `"L"`; `sq`: `"L"`; `swing`: `"phase"`, `"avg"`), pero en `HEAD:magia/floors.js` esas propiedades `variant` **no fueron declaradas**, causando que los tutoriales 5.1, 5.2, 5.4, 6.1, 6.2, 6.4, 10.3, 11.3, 12.1, 12.4, 13.2 y 13.3 muestren escenarios vacíos o idénticos.
4. **Bloqueo de carga en `p.preload()` con `p.loadImage()`**:
   - Cargar 37 sprites dentro de `p.preload()` congela p5.js si algún recurso tarda o se abre desde `file://`. Debe usarse el cargador asíncrono con `HTMLImageElement` + respaldo vectorial inmediato a 60 FPS (como se implementó en el motor nuevo).
5. **Conteo infinito en zócalos (`targets`) y encogimiento irreversible**:
   - En `onRelease()`, al soltar una pieza en un `target`, `tg.held` se incrementa sin verificar si la pieza ya estaba adentro, y el radio `pc.r` se encoge a `nest`. Si el usuario mueve la misma canica 5 veces dentro del mismo cuenco, el juego cree que metió 5 canicas distintas.
6. **Péndulos y columpios con pivote roto (`swing` y `photo`)**:
   - El dibujo de `pendulum` traza `p.line(0, -pc.arm, 0, 0)` trasladado a `(pc.x, pc.y)`. Al mover `pen.x` y `pen.y` en `update()`, se desplaza el palo vertical entero de lado a lado en vez de rotar el brazo desde un pivote fijo superior.

---

## 2. Tabla de Control de Depuración (Bitácora de los 14 Pisos)

| Piso | IDs | `kind` en Motor | Pifia Detectada | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **0. Motor Base** | Global | `EA_MAGIA` | Conflicto `clickable`/drag, `preload` bloqueante, `tg.held` duplicado, fusión de los 14 pisos con el motor de audio/chispas de Vaelithor. | ✅ Depurado |
| **I. El taller secreto** | `1.0`–`1.4` | `powers_of_ten`, `tens`, `costume`, `passport`, `recipe` | `abacoTap` falla si el mouse se mueve 1px; `passport` no dibuja `"¿?"` en sprites; `hat` tapa los ojos de Potato Head; `mousetrap` estático. | ✅ Depurado |
| **II. El país de las canicas** | `2.1`–`2.4` | `casita`, `parade`, `ramp`, `materials` | Electrones colapsan al centro en `ph=0`; palitos de KerPlunk (`stick`) no hacen nada al clic; coches en `ramp` no reinician `pc.s=0`; canica no llega al vidrio en `materials`. | ✅ Depurado |
| **III. El pasillo pegajoso** | `3.1`–`3.4` | `churro`, `awg`, `heatice`, `bands` | `nin` bloquea clics en `awg`; hielo en `heatice` no altera el medidor de resistencia; fichas en `bands` (`ph=2`) no se pueden arrastrar por `clickable: true`. | ✅ Depurado |
| **IV. Las cuatro cuentas** | `4.1`–`4.4` | `ohm`, `power`, `eff`, `energy` | Ratones en `ohm` no se tapan para despejar $V,I,R$; `power` clona `ramp` sin fórmula $P=VI$; `eff` permite $>100\%$; lámpara apagada en `energy` sigue marcando brillo 1. | ✅ Depurado |
| **V. Una sola fila** | `5.1`–`5.4` | `series`, `divider` | Faltan `variant: "identity"`, `"sum"` y `"fuse"` en `floors.js`; `divider` es 100% estático sin divisor de tensión interactivo. | ✅ Depurado |
| **VI. Varios caminos a la vez** | `6.1`–`6.4` | `parallel`, `kcl` | Faltan `variant: "easy"` y `"fuse"` en `floors.js`; lámparas no abren su rama; `kcl` no reparte las 9 canicas en las ramas de salida ($5 + 4$). | ✅ Depurado |
| **VII. El palacio de adentro hacia afuera** | `7.1`–`7.4` | `nest`, `ladder`, `pot`, `meters` | `nest` y `ladder` aceptan clics en orden incorrecto; `pot` sube el voltaje al conectar la carga `hippo` en vez de bajarlo; `meters` es estático. | ✅ Depurado |
| **VIII. Los disfraces y los mapas** | `8.1`–`8.4` | `isource`, `disguise`, `mesh`, `diamond` | `caterpillar` no camina; `tap.x > 800` bloquea el coche desde el inicio; `disguise` y `mesh` no tienen `update()`; `diamond` no permite equilibrar cartas UNO. | ✅ Depurado |
| **IX. Los trucos del palacio** | `9.1`–`9.4` | `super`, `box`, `match`, `echo` | `super` no muestra que el calor es cuadrático ($I^2R$); `box` no tiene `update()` para medir $V_{th}$ e $I_{cc}$; `echo` no permuta fuente y medidor. | ✅ Depurado |
| **X. El cubo que no olvida el tobogán** | `10.1`–`10.4` | `cap`, `tau`, `sq` | Placas en `cap` ignoran el arrastre manual; el dieléctrico `silk` no multiplica $C$; falta `variant: "bank"` en `10.3`; `sq` siempre muestra 4 monedas fijas. | ✅ Depurado |
| **XI. El río invisible del hierro** | `11.1`–`11.4` | `flux`, `gap`, `ohm`, `memory` | `varita` no arrastra canicas por el cuello en `flux`; `huequito` en `gap` no se puede arrastrar por `clickable: true`; falta `variant: "hopkinson"` en `11.3`; `memory` se encoge solo. | ✅ Depurado |
| **XII. El ovillo que no olvida el desfile** | `12.1`–`12.4` | `tau`, `lenz`, `freewheel`, `sq` | Faltan `variant: "L"` en `12.1` y `12.4`; en `lenz` el `nin` sale disparado a $-480\text{ px/s}$ al sostener el `silk` quieto; `freewheel` no desvía la canica por el diodo/arco. | ✅ Depurado |
| **XIII. El columpio** | `13.1`–`13.4` | `swing`, `rms` | Faltan `variant: "phase"` y `"avg"` en `13.2` y `13.3`; pivote del péndulo roto en `swing`; `rms` es estático sin comparador de calor AC vs DC. | ✅ Depurado |
| **XIV. La foto del columpio** | `14.1`–`14.4` | `photo`, `rlc`, `bill`, `streets` | Cámara en `photo` no congela el fasor al hacer clic; ratones en `rlc` no oscilan desfasados ($\pm 90^\circ$); flecha en `streets` no proyecta componentes real e imaginaria ($a + jb$). | ✅ Depurado |

---

## 3. Secuencia de Prompts para Depurar Cada Nivel sin Pifias

Copia y pega cada prompt en orden. Cada bloque está diseñado para reparar de forma definitiva el motor y los juegos de ese piso sin romper los anteriores.

---

### Prompt 0: Motor Base Unificado, Audio Web API, Carga Sin Bloqueo y Reparación de Inputs

**Copia y pega esto:**
> Actúa como un ingeniero experto en JavaScript, física interactiva y p5.js. Vamos a depurar la arquitectura base de la sección **Magia** (`magia/floors.js` y `magia/magia.js`) antes de reparar piso por piso.
>
> Realiza las siguientes correcciones estructurales en `magia/floors.js` y `magia/magia.js`:
> 1. **Restauración y Fusión de Datos (`magia/floors.js`)**:
>    - Restaura los 14 pisos completos desde `git show HEAD:magia/floors.js` e integra el ejercicio de Vaelithor de resistores de madera (`powers_of_ten`: $2.000\ \Omega \to 2\text{ k}\Omega$ y $3.000.000\ \Omega \to 3\text{ M}\Omega$) dentro del Piso I (o como pestaña destacada en 1.1/1.2) para no perder ningún contenido.
>    - Añade explícitamente las propiedades `variant` que faltaban en `floors.js`:
>      - `5.1`: `variant: "identity"`, `5.2`: `variant: "sum"`, `5.4`: `variant: "fuse"`
>      - `6.1`: `variant: "nodes"`, `6.2`: `variant: "easy"`, `6.4`: `variant: "fuse"`
>      - `10.3`: `variant: "bank"`
>      - `11.3`: `variant: "hopkinson"`
>      - `12.1`: `variant: "L"`, `12.4`: `variant: "L"`
>      - `13.2`: `variant: "phase"`, `13.3`: `variant: "avg"`
> 2. **Carga de Imágenes No Bloqueante (`magia/magia.js`)**:
>    - Elimina `p.preload()` de p5.js para evitar congelamientos por CORS o `file://`.
>    - Usa un diccionario de `HTMLImageElement` precargado en segundo plano para todos los sprites (`cuenco`, `proton`, `electron`, `nin`, `varita`, `plus`, `minus`, `linterna`, `silk`, `prado`, `mesa-vacia`, `abaco`, `piramide`, `cups`, `potato`, `silk-kilo`, `silk-mili`, `car`, `connect4`, `rainbow`, `bowl-dark`, `bowl-med`, `bowl-small`, `marble`, `shoe`, `hourglass`, `bills`, `bill-1`, `bill-10`, `bill-5`, `scale`, `register`, `triangle`, `mousetrap`, `passport`, `glasses`, `hat-bow`, `kapla-stack`, `playroom_bg`, `mago_vaelithor`, `wooden_resistor`, `wooden_tray`, `cube_2000`, `cube_3m`, `cube_10_3`, `cube_10_6`, `disc_kohm`, `disc_mohm`, `vaelithor_avatar`). Si una imagen aún no carga, dibuja el juguete vectorial de respaldo (`drawToy`).
> 3. **Separación Limpia entre Clic y Arrastre (`onPress`, `onDrag`, `onRelease`)**:
>    - Corrige la pifia donde `if (pc.clickable) { clickPiece(pc); return; }` impedía arrastrar piezas móviles.
>    - En `onPress`: si la pieza no es `static`, permite iniciar el arrastre (`dragging = pc; dragMoved = false;`).
>    - En `onRelease`: si `Math.hypot(pc.x - pc.startX, pc.y - pc.startY) < 6` (fue un clic sin arrastre) y `pc.clickable` es `true`, ejecuta `clickPiece(pc)`. Así una misma pieza puede ser tanto arrastrable como clicable sin conflicto.
> 4. **Conteo Exacto de Zócalos y Cuencos (`targets`)**:
>    - Al soltar una pieza dentro de un `target` (`tg`), asigna `pc.inTarget = tg` y recalcula `tg.held = world.pieces.filter(p => p.inTarget === tg).length` en cada frame o al soltar/sacar la pieza. Así, sacar una canica del cuenco descuenta `tg.held` correctamente y nunca se infla el contador.
> 5. **Efectos de Sonido y Chispas**:
>    - Mantén las funciones `playWoodClick()` y `playMagicChime()` con Web Audio API y el sistema de partículas `sparks` para dar retroalimentación inmediata al encajar piezas o acertar preguntas.

---

### Prompt 1: Depuración del Piso I — «El taller secreto» (`1.1` a `1.4` + `powers_of_ten`)

**Copia y pega esto:**
> Vamos a depurar a fondo el **Piso I (El taller secreto)** en `magia/magia.js` (`KINDS.powers_of_ten`, `KINDS.tens`, `KINDS.costume`, `KINDS.passport`, `KINDS.recipe`).
>
> Corrige las siguientes pifias específicas:
> 1. **`1.1 La escalera de dieces` (`KINDS.tens`)**:
>    - **Rincón 1 (`ph === 0`)**: Haz que tocar o arrastrar el ábaco (`abaco`) incremente `world.flags.abacoTap` de 1 en 1 hasta 10 (con sonido `playWoodClick()`), iluminando las filas de cuentas y mostrando en una etiqueta dinámica la potencia: $10^0 = 1$, $10^1 = 10$, $10^2 = 100$, $10^3 = 1.000$.
>    - **Rincón 2 (`ph === 1`)**: Al arrastrar canicas a los cuencos `chico · 1`, `mediano · 10` y `grande · 100`, muestra un marcador totalizador en vivo: $\text{Total} = 100 \cdot n_{\text{grande}} + 10 \cdot n_{\text{mediano}} + 1 \cdot n_{\text{chico}}$.
>    - **Rincón 3 (`ph === 2`)**: Al acercar el `vaso chico` (`n: 1`) al `vaso gordo` (`n: 5`), haz una animación de vertido y devuelve el vaso chico a su posición inicial (`origX, origY`) en lugar de dejarlo atrapado dentro del vaso gordo, incrementando el medidor `Vertidos` hasta $5/5$ ($5 \times 0,2 = 1,0$).
>    - **Rincón 4 (`ph === 3`)**: Al arrastrar billetes de `1` sobre el `billete 10`, muestra el canje de ingeniería ($10 \times 1 = 1 \times 10^1$) y añade un botón o pestaña rápida en este tutorial para alternar con la bandeja de encastre de **Vaelithor** ($2.000\ \Omega = 2 \times 10^3\ \Omega = 2\text{ k}\Omega$ y $3.000.000\ \Omega = 3 \times 10^6\ \Omega = 3\text{ M}\Omega$).
> 2. **`1.2 El armario de los disfraces` (`KINDS.costume`)**:
>    - **Rincón 1 (`ph === 0`)**: Al colocar la tela `kilo` o `mili` sobre el Nin (`el tesoro desnudo`), actualiza un cartel superior que muestre la transformación: $1\text{ Nin} = 0,001\text{ kilo-Nins} = 1.000\text{ mili-Nins}$.
>    - **Rincón 2 (`ph === 1`)**: Corrige la coordenada de los sombreros (`hat`) sobre `potato`: al hacer clic o arrastrar un sombrero (`Tera`, `Giga`, `Mega`, `Kilo`, `mili`, `micro`, `nano`, `pico`), colócalo en `pot.y - 95` (en la cabeza del Potato Head, no tapándole los ojos) y muestra un cartel con su factor exponencial ($10^{12}, 10^9, 10^6, 10^3, 10^{-3}, 10^{-6}, 10^{-9}, 10^{-12}$).
>    - **Rincón 3 (`ph === 2`)**: Igual que en `tens`, al verter el vaso `1` en el vaso `5`, retorna el vaso `1` a su sitio con sonido e incrementa el llenado.
>    - **Rincón 4 (`ph === 3`)**: Al apilar las 6 monedas de `1.000` en el zócalo `seis kilos`, muestra cómo `6 × 1.000` se compacta visualmente en `6 k`.
> 3. **`1.3 La aduana de los pasaportes` (`KINDS.passport`)**:
>    - **Rincón 1 (`ph === 0`)**: Corrige el bug donde `pc.empty = true` solo se dibujaba en `kind === "paper"`. En `drawPiece`, si `pc.empty === true` para cualquier pieza (`passport`, `car`, `hourglass`), dibuja un halo dorado con el signo `"¿?"` encima y muestra en el cartel la ecuación despejada: $d = v \cdot t$, $v = d / t$, o $t = d / v$.
>    - **Rincón 2 (`ph === 1`)**: Dibuja marcas de tramos ($0\text{ m}$ a $10\text{ m}$) en la mesa para que al arrastrar el coche el medidor `Tramos` y la velocidad calculada tengan referencia visual clara.
>    - **Rincón 3 (`ph === 2`)**: Dibuja un pasillo de madera de $600\text{ px}$ y muestra cuántos `zapatos` (pies, $\approx 10$) vs cuántos `silks` (metros, $\approx 3$) caben en el mismo pasillo al arrastrarlos.
>    - **Rincón 4 (`ph === 3`)**: Haz que la `balanza` (`scale`) incline su brazo dinámicamente según las canicas puestas en `libras` vs `kilos` ($1\text{ kg} \approx 2,2\text{ lb}$).
> 4. **`1.4 Primero lo de adentro` (`KINDS.recipe`)**:
>    - **Rincón 1 (`ph === 0`)**: Coloca 3 fichas interactivas con pasos `1. Paréntesis (4+8=12)`, `2. Multiplicar (6×12=72)`, `3. Resultado (72)`. Valida que el jugador las toque en el orden correcto de jerarquía de operaciones.
>    - **Rincón 3 (`ph === 2`)**: Cuando el jugador arrastre la canica al inicio de `mousetrap`, anima su recorrido paso a paso hasta caer en el cuenco final `la caja` con chispas.

---

### Prompt 2: Depuración del Piso II — «El país de las canicas» (`2.1` a `2.4`)

**Copia y pega esto:**
> Ahora vamos a depurar el **Piso II (El país de las canicas)** en `magia/magia.js` (`KINDS.casita`, `KINDS.parade`, `KINDS.ramp`, `KINDS.materials`).
>
> Corrige las siguientes pifias específicas:
> 1. **`2.1 Las casitas y el hechizo del prado` (`KINDS.casita`)**:
>    - **Rincón 1 (`ph === 0`)**: Corrige el bug en `updateWorld` donde los electrones con `orbitR: 130` colapsaban inmediatamente al centro `(640, 355)` aunque `orbitSp` fuera `0`. Solo activa `pc.orbitR = 130` y `pc.orbitSp = 0.03` para un electrón cuando el jugador lo arrastre cerca del cuenco atómico o cuando ya haya colocado protones y Nins en el núcleo.
>    - **Rincón 2 (`ph === 1`)**: En las 3 casitas (`Conductor`, `Aislante`, `Semiconductor`), haz que al tocar `Conductor` sus electrones salgan viajando libremente entre átomos; en `Aislante` permanezcan fijos; y en `Semiconductor` solo aceleren y salgan a conducir mientras la `linterna` arrastrable los ilumine de cerca (`dist < 140`).
>    - **Rincón 3 (`ph === 2`)**: En la ley de Coulomb, dibuja flechas vectoriales de fuerza entre las cargas (atracción si tienen signos opuestos, repulsión si tienen signos iguales) y permite invertir el signo (`+` ↔ `−`) con un clic limpio sin interferir con el arrastre.
>    - **Rincón 4 (`ph === 3`)**: Al acercar o alejar las placas `plus` y `minus`, muestra la distancia $r$ y el valor numérico de $F \propto 1/r^2$ en el medidor y con líneas de campo eléctrico entre ambas placas.
> 2. **`2.2 El túnel del desfile` (`KINDS.parade`)**:
>    - **Rincón 1 (`ph === 0`)**: Al meter 10 canicas en el cuenco (`un paquete = 10`), emite un `playMagicChime()` y muestra el cartel `"¡1 Paquete de carga (1 Coulomb) listo!"`.
>    - **Rincón 2 y 3 (`ph === 1, 2`)**: Reemplaza el `paper` por el sprite real `hourglass` (`reloj`). Al tocar el reloj, lanza un paquete de canicas rodando por el carril (`path: 0`) y calcula en vivo la corriente $I = Q / t$ (paquetes por segundo) en el medidor.
>    - **Rincón 4 (`ph === 3`)**: Corrige los palitos de KerPlunk (`stick`): al hacerles clic o arrastrarlos fuera del tubo, retíralos. Cuando queden menos de 4 palitos (sobrecorriente), abre la compuerta y deja caer todas las canicas por gravedad hacia abajo indicando `"¡Fusible fundido! Circuito protegido"`.
> 3. **`2.3 El tobogán y las tres alcancías` (`KINDS.ramp`)**:
>    - Corrige el bug donde un coche que llegaba al final del tobogán (`pc.s = 1`) ya no volvía a rodar al hacerle clic pero seguía regalando monedas infinitas. Al hacer clic en un coche con `pc.s >= 1`, reinícialo a `pc.s = 0` en la cima de su rampa y lánzalo (`car.roll = 1`).
>    - Haz que el coche de la rampa alta (`path: 1`, mayor voltaje) viaje más rápido y entregue **2 monedas por viaje**, mientras que el de la rampa baja (`path: 0`, menor voltaje) entregue **1 moneda**.
>    - En `ph === 3` (`silk` ondulado vs liso), permite arrastrar o tocar el `silk` para alisarlo (rectificación AC → DC) y mostrar una fila continua de canicas a ritmo constante.
> 4. **`2.4 Pasillos, puertas y dos relojes` (`KINDS.materials`)**:
>    - Extiende el carril (`path: 0`) hasta `x = 800` (justo frente al muro `vidrio` de Kapla en `x = 820`) para que la canica choque contra el aislante y rebote, a menos que el usuario retire la puerta de vidrio.
>    - En `ph >= 2`, añade dos zócalos (`targets`): uno **en serie** dentro del pasillo para encajar a `Operation` (Amperímetro, mide el desfile en la fila) y otro **en paralelo** a los lados del tobogán para encajar a `Guess Who` (Voltímetro, mide la altura entre dos puntos).

---

### Prompt 3: Depuración del Piso III — «El pasillo pegajoso» (`3.1` a `3.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso III (El pasillo pegajoso)** en `magia/magia.js` (`KINDS.churro`, `KINDS.awg`, `KINDS.heatice`, `KINDS.bands`).
>
> Corrige las siguientes pifias específicas:
> 1. **`3.1 Largo, gordo, de qué está hecho` (`KINDS.churro`)**:
>    - Añade un flujo continuo de canicas que atraviesen el `churro` de izquierda a derecha a una velocidad inversamente proporcional a la resistencia $R = \rho \cdot \frac{L}{A}$.
>    - Muestra en pantalla la etiqueta con los 3 materiales al mover el slider `material`: `Plata/Cobre (fácil)`, `Aluminio (medio)`, `Hierro/Nicrom (difícil)`, y añade un segundo medidor `Cansancio (R)` junto a `Desfile (I)`.
> 2. **`3.2 El calibre: cada tres números, a la mitad` (`KINDS.awg`)**:
>    - Corrige la pifia donde el `nin` se teletransportaba a `(640, 360)` encima de los discos concéntricos bloqueando los siguientes clics. Coloca el `nin` a un costado (`x = 240, y = 360`) escalando su tamaño o muestra los 8 calibres AWG (`AWG 10`, `AWG 13`, `AWG 16`, `AWG 19`...) en una hilera horizontal ordenada de más gordo a más fino para que cada uno se pueda tocar sin solaparse.
>    - Al tocar cada calibre, muestra su área relativa (cada 3 números AWG el área cae a la mitad y la resistencia se duplica).
> 3. **`3.3 El calor queja, el hielo calla` (`KINDS.heatice`)**:
>    - Conecta los cubitos de `ice` (superconductor en `ph >= 2`) con el cálculo real: mientras queden cubos de hielo sobre el conductor, fuerza una barra especial `Superconductor (con hielo)` a cansancio $0,0\ \Omega$. A medida que el usuario quite los hielos con clic, sube la temperatura y haz que reaparezca la resistencia.
>    - Permite también arrastrar la `linterna` cerca del churro `NTC` para calentarlo localmente y ver cómo su cansancio cae mientras el del cobre sube.
> 4. **`3.4 El tapón con disfraz` (`KINDS.bands`)**:
>    - **Rincón 1 (`ph === 0`)**: Dibuja un resistor grande en el centro con 4 ranuras de banda (`Banda 1`, `Banda 2`, `Multiplicador`, `Tolerancia`). Al arrastrar las fichas de colores a cada ranura, pinta la banda en el resistor y muestra el valor decodificado en ohmios (ej. Rojo-Negro-Rojo-Oro = $2.000\ \Omega \pm 5\%$).
>    - **Rincón 2 (`ph === 1`)**: Muestra tanto $R$ (pegajoso, en $\Omega$) como $G = 1/R$ (conductancia, en Siemens) en tiempo real al mover el slider.
>    - **Rincón 3 (`ph === 2`)**: Gracias a la separación clic/arrastre del Prompt 0, asegura que las fichas `tile` se puedan arrastrar al cuenco `Perfection` (continuidad / corto = $0\ \Omega$, abierto = $\infty\ \Omega$).
>    - **Rincón 4 (`ph === 3`)**: Cuando el slider `empujón` (voltaje) supere `0.7` (sobretensión), anima al `hippo` (varistor) abriendo la boca y tragándose el pico de corriente para proteger el circuito.

---

### Prompt 4: Depuración del Piso IV — «Las cuatro cuentas» (`4.1` a `4.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso IV (Las cuatro cuentas)** en `magia/magia.js` (`KINDS.ohm`, `KINDS.power`, `KINDS.eff`, `KINDS.energy`).
>
> Corrige las siguientes pifias específicas:
> 1. **`4.1 Los tres amigos nunca se separan` (`KINDS.ohm`)**:
>    - Haz que los tres ratones Maileg (`Empujón (V)`, `Desfile (I)`, `Cansancio (R)`) estén dispuestos en el triángulo clásico de la Ley de Ohm y sean `clickable: true`.
>    - Al tocar uno de los tres ratones ("taparlo con la mano"), márcalo como incógnita (`¿?`) y muestra la fórmula exacta con los otros dos:
>      - Tapar `Empujón`: $V = I \times R$
>      - Tapar `Desfile`: $I = V / R$
>      - Tapar `Cansancio`: $R = V / I$
> 2. **`4.2 Qué tan rápido corre el tesoro` (`KINDS.power`)**:
>    - Elimina la asignación `KINDS.power = KINDS.ramp;` y crea un `KINDS.power` propio y dedicado.
>    - Incluye sliders para `Empujón (V)` y `Desfile (I)`, un coche que lleva monedas a la cesta `Luggy` a un ritmo proporcional a la potencia $P = V \times I$, y etiquetas dinámicas que muestren las tres formas de la potencia ($P = V \cdot I$, $P = I^2 \cdot R$, $P = V^2 / R$) y la equivalencia $746\text{ W} = 1\text{ caballo (hp)}$.
> 3. **`4.3 Lo que llega y lo que se pierde` (`KINDS.eff`)**:
>    - En los 3 cuencos en cascada (`1. Fuente (Entrada)`, `2. Calor perdido (Operation)`, `3. Casa (Salida útil)`), haz que al meter canicas en `Fuente`, una fracción pase automáticamente a `Casa` y otra caiga en `Calor perdido` según el rendimiento $\eta$, o permite repartir las 10 canicas entre `Calor perdido` y `Casa` de modo que $\text{Entrada} = \text{Perdido} + \text{Útil}$ y la eficiencia $\eta = \frac{\text{Útil}}{\text{Entrada}} \times 100\%$ jamás supere el $100\%$.
>    - En `ph >= 2`, muestra dos etapas en cascada ($\eta_{\text{total}} = \eta_1 \times \eta_2$, ej. $0,8 \times 0,8 = 0,64 = 64\%$).
> 4. **`4.4 El tesoro y el reloj` (`KINDS.energy`)**:
>    - Corrige el bug donde apagar la lámpara (`lamp.on = false`) dejaba el medidor de brillo en `1` y seguía cobrando energía.
>    - Si `lamp.on === false`, el brillo (potencia $P$) y el gasto son `0`. Si `lamp.on === true`, añade un segundo slider `Potencia (focos)` además de `Tiempo (minutos)` para comprobar que $E = P \times t$, animando monedas que caen en la alcancía del medidor eléctrico.

---

### Prompt 5: Depuración del Piso V — «Una sola fila» (`5.1` a `5.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso V (Una sola fila — Circuitos en Serie)** en `magia/magia.js` (`KINDS.series`, `KINDS.divider`).
>
> Corrige las siguientes pifias específicas:
> 1. **Diferenciación garantizada de los tutoriales `5.1`, `5.2` y `5.4` en `KINDS.series`**:
>    - Además de leer `w.variant`, respalda la detección usando `t.id`:
>      - Si `t.id === "5.1"` (`identity`): coloca 3 Nins a lo largo del único camino con contadores individuales que marquen exactamente el mismo número de canicas por segundo ($I_1 = I_2 = I_3 = I_{\text{total}}$) cuando pasan las canicas en bucle (`loop: true`).
>      - Si `t.id === "5.2"` (`sum`): coloca 3 tramos de resistencia arrastrables (`liso = 2 Ω`, `campana = 3 Ω`, `zigzag = 5 Ω`) que se encajan en serie sobre la pista. A medida que se encajan, suma $R_T = R_1 + R_2 + R_3$ en el medidor y reduce proporcionalmente la velocidad de las canicas.
>      - Si `t.id === "5.4"` (`fuse`): coloca 3 lámparas en serie encendidas y el bloque de hielo/fusible (`ice`). Al hacer clic o sacar el fusible (o abrir cualquiera de las lámparas), abre el camino (`path.open = false`), detén inmediatamente todas las canicas y apaga las 3 lámparas al mismo tiempo. Permite volver a colocar el fusible para reanudar.
> 2. **`5.3 El rebanador de empujón` (`KINDS.divider` — Divisor de Voltaje)**:
>    - Convierte `KINDS.divider` en un laboratorio interactivo de divisor de tensión ($V_x = E \cdot \frac{R_x}{R_T}$).
>    - Añade un slider para el `Empujón total (E)` (por defecto $9\text{ V}$) y permite cambiar o tocar los bloques de resistencia ($R_1 = 1\ \Omega$, $R_2 = 3\ \Omega$, $R_3 = 5\ \Omega$).
>    - Dibuja al lado de cada bloque su barra de caída de voltaje ($V_1 = 1\text{ V}$, $V_2 = 3\text{ V}$, $V_3 = 5\text{ V}$) y en el rincón 4 (`ph === 3`) incluye dos puntos de referencia en el suelo para mostrar la diferencia de potencial con signos ($V_{AB} = V_A - V_B$).

---

### Prompt 6: Depuración del Piso VI — «Varios caminos a la vez» (`6.1` a `6.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso VI (Varios caminos a la vez — Circuitos en Paralelo)** en `magia/magia.js` (`KINDS.parallel`, `KINDS.kcl`).
>
> Corrige las siguientes pifias específicas:
> 1. **Diferenciación y física real en `KINDS.parallel` (`6.1`, `6.2`, `6.4`)**:
>    - Respalda la variante por `t.id` (`6.1` = `"nodes"`, `6.2` = `"easy"`, `6.4` = `"fuse"`).
>    - Activa `loop: true` en las ramas paralelas para que las canicas/coches circulen continuamente entre la `Casa A` (barra positiva) y la `Casa B` (barra negativa), o reinicia `pc.s = 0` al tocar cada coche.
>    - **`6.1 Las mismas dos casas`**: Muestra claramente que ambas ramas nacen en la `Casa A` y terminan en la `Casa B`, compartiendo el mismo tobogán ($V_1 = V_2 = E$).
>    - **`6.2 El camino fácil se lleva el desfile` (Divisor de Corriente)**: Añade un slider para el grosor/resistencia de la rama inferior ($R_2$) frente a la superior ($R_1$). Muestra cómo la rama más gorda (menor $R$, mayor conductancia $G$) recibe más canicas por segundo ($I_1 = I_T \frac{R_2}{R_1 + R_2}$) y cómo la resistencia equivalente paralela $R_{eq}$ siempre es menor que la menor de las ramas.
>    - **`6.4 Se funde una, las demás brillan`**: Haz que cada rama tenga su propio interruptor/fusible (`lamp` o `stick`). Al tocar la lámpara de la rama 1, se abre solo `paths[0]` y se detiene el coche 1, mientras `paths[1]` y su lámpara siguen funcionando intactos. En `ph >= 2`, permite arrastrar el listón `corto` ($0\ \Omega$) entre las dos casas para ver cómo desvía todo el desfile y dispara el fusible principal.
> 2. **`6.3 Lo que entra, sale` (`KINDS.kcl` — Ley de Kirchhoff de Corrientes)**:
>    - Cuando el usuario arrastre las canicas de las 3 ramas de entrada (`entra 3`, `entra 2`, `entra 4` $\to \sum I_{\text{entra}} = 9$) al cuenco central `nudo`, haz que salgan automáticamente rodando por las dos pistas de salida: las primeras 5 hacia arriba (`sale 5`) y las 4 restantes hacia abajo (`¿sale ? = 4`), verificando visualmente que $\sum I_{\text{entra}} = \sum I_{\text{sale}}$.

---

### Prompt 7: Depuración del Piso VII — «El palacio de adentro hacia afuera» (`7.1` a `7.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso VII (El palacio de adentro hacia afuera — Redes Serie-Paralelo)** en `magia/magia.js` (`KINDS.nest`, `KINDS.ladder`, `KINDS.pot`, `KINDS.meters`).
>
> Corrige las siguientes pifias específicas:
> 1. **`7.1 Muñecas rusas` (`KINDS.nest`)**:
>    - Valida el orden estricto de reducción de adentro hacia afuera: el jugador debe tocar primero el arco más interno (`n = 0`), luego `n = 1`, y así sucesivamente hasta el exterior (`n = 7`).
>    - Al tocar el arco correcto, fusiónalo visualmente con un destello dorado (`playWoodClick()`) mostrando cómo un bloque serie o paralelo interno se reemplaza por un único resistor equivalente $R_{eq}$. En `ph >= 2`, invierte el proceso (reabrir de afuera hacia adentro para repartir voltajes y corrientes).
> 2. **`7.2 La escalera se baja desde el último peldaño` (`KINDS.ladder`)**:
>    - Exige que el usuario reduzca la escalera empezando por el último peldaño a la derecha/arriba (`n = 3`, luego `2`, `1`, `0`). Si toca el primer peldaño antes de tiempo, muestra un aviso amistoso `"¡Por ahí se enreda! Empieza desde el último peldaño"` y sacude la pieza suavemente.
> 3. **`7.3 La invitada en el brazo del palito` (`KINDS.pot` — Potenciómetro Cargado)**:
>    - Corrige el signo físico del efecto de carga: en el código anterior, acercar a `hippo` (`golosa`, resistencia de carga $R_L$ en paralelo con el tramo inferior del potenciómetro) sumaba `+0.15` al voltaje en vez de reducirlo.
>    - Calcula la tensión real del divisor cargado: si el cursor está en la fracción $\alpha \in [0,1]$, sin carga $V_{\text{out}} = \alpha$; cuando `hippo` se conecta cerca del cursor (`dist < 130`), el paralelo entre el tramo inferior y $R_L$ **baja** la tensión a $V_{\text{out}} = \frac{\alpha \cdot R_L}{\alpha(1-\alpha) + R_L}$. Cuando se acerca la `canica educada` ($R_L \to \infty$), la tensión no cae.
> 4. **`7.4 Tres detectives` (`KINDS.meters`)**:
>    - Añade 3 zócalos interactivos (`targets`) en el circuito para que el usuario arrastre cada instrumento a su conexión correcta:
>      - `Operation (Amperímetro)` $\to$ zócalo **en la fila (serie)**.
>      - `Guess Who (Voltímetro)` $\to$ zócalo **al lado (paralelo)**.
>      - `Perfection (Ohmímetro)` $\to$ zócalo con un interruptor previo para **apagar la fuente del palacio** antes de medir resistencia.

---

### Prompt 8: Depuración del Piso VIII — «Los disfraces y los mapas» (`8.1` a `8.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso VIII (Los disfraces y los mapas — Fuentes, Mallas, Nudos y Puente/Δ-Y)** en `magia/magia.js` (`KINDS.isource`, `KINDS.disguise`, `KINDS.mesh`, `KINDS.diamond`).
>
> Corrige las siguientes pifias específicas:
> 1. **`8.1 El tesoro que manda desfile` (`KINDS.isource` — Fuente de Corriente)**:
>    - Haz que al tocar a `caterpillar` (`Code-a-pillar`), lance canicas a un ritmo constante e inalterable (fuente de corriente $I_s$), sin importar qué tapón (`churro`) pongas en su camino, cambiando en su lugar el voltaje en bornes ($V = I_s \cdot R$).
>    - Corrige la posición inicial del `churro` para que solo bloquee el final de la rampa cuando el usuario realmente lo arrastre sobre el carril.
> 2. **`8.2 Cambiar de disfraz` (`KINDS.disguise` — Conversión de Fuentes)**:
>    - Añade la función `update()` que faltaba: al hacer clic en `robot` (`Transformers`) o cambiar el sombrero de `potato`, alterna visualmente la caja izquierda entre **Disfraz de Empujón** (Fuente de voltaje $E$ en serie con $R_s$) y **Disfraz de Desfile** (Fuente de corriente $I = E/R_s$ en paralelo con $R_s$), manteniendo idéntico el medidor de corriente y voltaje sobre el `Nin de carga` exterior.
> 3. **`8.3 Círculos o casas` (`KINDS.mesh` — Mallas vs Nudos)**:
>    - Añade `update()` y `draw()` interactivos: dibuja canicas circulando en sentido horario por la `malla 1` ($I_1$) y la `malla 2` ($I_2$). En la `pared compartida` central (`kapla`), muestra en vivo la resta de corrientes ($I_{\text{central}} = I_1 - I_2$) con sliders para $I_1$ e $I_2$. En `ph >= 2`, muestra la vista dual de **casas (tensiones de nudo)** respecto al suelo de referencia.
> 4. **`8.4 El diamante que no manda a nadie por en medio` (`KINDS.diamond` — Puente de Wheatstone y Δ-Y)**:
>    - En `ph === 0` y `ph === 1`, permite hacer clic en la cuarta carta UNO (`10` ↔ `20`) para alternar en vivo entre puente desequilibrado ($5 \times 20 \neq 5 \times 10$, la canica central se mueve por el puente) y puente equilibrado ($5 \times 10 = 5 \times 10$, la canica central queda en reposo absoluto en el centro y el puente puede retirarse).
>    - En `ph >= 2`, dibuja la transformación **Delta ($\Delta$, triángulo) ↔ Estrella ($Y$, trébol)** permitiendo alternar entre las 3 ramas exteriores ($\Delta$) y las 3 ramas al nudo central ($Y$, con $R_Y = R_\Delta / 3$ para ramas iguales).

---

### Prompt 9: Depuración del Piso IX — «Los trucos del palacio» (`9.1` a `9.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso IX (Los trucos del palacio — Teoremas de Redes)** en `magia/magia.js` (`KINDS.super`, `KINDS.box`, `KINDS.match`, `KINDS.echo`).
>
> Corrige las siguientes pifias específicas:
> 1. **`9.1 Encender un tesoro a la vez` (`KINDS.super` — Superposición)**:
>    - Dibuja un pasillo central compartido por donde pasan canicas azules cuando `tesoro A` está encendido ($I_A = 1\text{ A}$) y canicas rojas cuando `tesoro B` está encendido ($I_B = 1\text{ A}$).
>    - Añade un segundo medidor `Calor en el churro (I²)`: muestra que con solo A encendido el calor es $1^2 = 1\text{ W}$, con solo B es $1^2 = 1\text{ W}$, pero con A y B encendidos a la vez la corriente se suma ($1 + 1 = 2\text{ A}$) y el calor sube a $(1+1)^2 = 4\text{ W}$ (¡no $1+1=2\text{ W}$!), demostrando visualmente por qué la superposición es lineal para $V$ e $I$ pero no para la potencia.
> 2. **`9.2 La cajita de dos bornes` (`KINDS.box` — Teorema de Thévenin y Norton)**:
>    - Añade `update()` y 3 modos de prueba interactivos al arrastrar o desconectar el `Nin-carga` de los dos bornes de la `cajita`:
>      - **Bornes abiertos (sin carga)**: mide el tobogán en vacío $V_{th}$.
>      - **Bornes en puente (corto)**: mide el desfile máximo $I_N = I_{cc}$.
>      - **Fuentes apagadas (solo pasillo)**: mide la resistencia interna $R_{th} = V_{th} / I_N$.
> 3. **`9.3 El mejor tesoro` (`KINDS.match` — Máxima Transferencia de Potencia)**:
>    - Al tocar cada carga (`carga 1`, `carga 2`, `carga 4`, `carga 8`) frente a la cajita con pasillo interno $R_{th} = 4\ \Omega$ y fuente $E = 8\text{ V}$, calcula la potencia real $P_L = \left(\frac{E}{R_{th} + R_L}\right)^2 R_L$ y añade un segundo medidor `Eficiencia (%)` ($\eta = \frac{R_L}{R_{th} + R_L} \times 100\%$).
>    - Muestra cómo en $R_L = 4\ \Omega$ el tesoro entregado alcanza el máximo absoluto, mientras que la eficiencia en ese punto es exactamente del $50\%$.
> 4. **`9.4 El eco es justo` (`KINDS.echo` — Reciprocidad, Millman y Sustitución)**:
>    - En `ph === 0, 1` (Reciprocidad), coloca una fuente (`linterna`) en la rama A y un contador (`Operation`) en la rama B. Añade un botón/acción sobre las piezas para **permutar sus puestos** (fuente en B, contador en A) y verificar que el desfile medido es exactamente idéntico.
>    - En `ph >= 2` (Millman), muestra 3 ramas con fuentes en paralelo que se promedian ponderadas por la facilidad ($G_i = 1/R_i$) de cada pasillo.

---

### Prompt 10: Depuración del Piso X — «El cubo que no olvida el tobogán» (`10.1` a `10.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso X (El cubo que no olvida el tobogán — Capacitores)** en `magia/magia.js` (`KINDS.cap`, `KINDS.tau`, `KINDS.sq`).
>
> Corrige las siguientes pifias específicas:
> 1. **`10.1 Dos bandejas y un viento` y `10.3 Cubos juntos` (`KINDS.cap`)**:
>    - Sincroniza el arrastre manual de las placas (`plate`) con el slider `distancia`: si el usuario arrastra una placa con el mouse, actualiza `world.height` y la posición del slider en vez de sobrescribir la posición de la placa.
>    - Haz que arrastrar la tela `silk` (dieléctrico $\varepsilon_r$) entre las dos placas multiplique por $2,5$ el medidor `Cubo (Capacitancia C)` ($C = \varepsilon \frac{A}{d}$) y dibuje líneas de campo eléctrico ("el viento") entre las placas.
>    - Para `10.3` (`t.id === "10.3"` o `w.variant === "bank"`), activa la interacción en los cuencos `paralelo` ($C_{eq} = C_1 + C_2$, más área total) y `serie` ($\frac{1}{C_{eq}} = \frac{1}{C_1} + \frac{1}{C_2}$, donde el cuenco más chico recibe mayor tensión $V = Q/C$).
> 2. **`10.2 Llenar despacio, vaciar despacio` (`KINDS.tau` — Transitorio RC)**:
>    - Añade un interruptor de carga/descarga (`Cargar cubo` ↔ `Vaciar cubo`) que avance un reloj en múltiplos de $\tau = R \cdot C$ ($1\tau \to 63,2\%$, $2\tau \to 86,5\%$, $3\tau \to 95,0\%$, $5\tau \to 99,3\%$), además de permitir arrastrar canicas manualmente, dibujando la curva exponencial en vivo sobre la pizarra.
> 3. **`10.4 El tesoro escondido al cuadrado` (`KINDS.sq` — Energía $\frac{1}{2}CV^2$)**:
>    - Haz que al mover el slider `tobogán (V)` de $1$ a $4$, el número de monedas (`coin`) visibles en la mesa se actualice dinámicamente a $1, 4, 9, 16$ ($V^2$), y añade un arco (`flash`) clicable que descargue de golpe todas las monedas con una ráfaga de chispas.

---

### Prompt 11: Depuración del Piso XI — «El río invisible del hierro» (`11.1` a `11.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso XI (El río invisible del hierro — Circuitos Magnéticos)** en `magia/magia.js` (`KINDS.flux`, `KINDS.gap`, `KINDS.ohm`, `KINDS.memory`).
>
> Corrige las siguientes pifias específicas:
> 1. **`11.1 El río y el cuello` (`KINDS.flux` — Flujo $\Phi$ y Densidad $B = \Phi / A$)**:
>    - Haz que las 10 canicas magnéticas circulen en bucle continuo a lo largo del río púrpura, apretándose y acelerando al pasar por el `cuello` estrecho de Kapla, o siendo atraídas cuando el usuario acerca la `varita` magnética.
>    - Añade un slider para el ancho del `cuello` (área $A$) para ver cómo con el mismo río ($\Phi$ constante), un cuello a la mitad de ancho duplica la densidad $B$ (teslas).
> 2. **`11.2 El huequito se come el empujón` (`KINDS.gap` — Reluctancia y Entrehierro)**:
>    - Gracias a la separación clic/arrastre del Prompt 0, asegura que la pieza `huequito` (`kapla`) se pueda arrastrar fuera del anillo ferromagnético o abrir/cerrar con un clic.
>    - Cuando el huequito de aire está abierto, dibuja el abombamiento de las líneas de flujo (*fringing*) en los bordes del aire y sube el medidor `Empujón necesario (FMM = N·I)` a `0.90`.
> 3. **`11.3 Vueltas por desfile` (`KINDS.ohm` con `hopkinson`)**:
>    - Detecta `t.id === "11.3"` o `w.variant === "hopkinson"` para mostrar la Ley de Hopkinson ($\mathcal{F} = N \cdot I = \Phi \cdot \mathcal{R}$), con los tres ratones etiquetados como `Empujón de vueltas (N·I)`, `Río magnético (Φ)` y `Lo difícil del núcleo (ℛ)`.
> 4. **`11.4 El hierro no va y vuelve por la misma raya` (`KINDS.memory` — Histéresis y Saturación)**:
>    - Corrige el bug donde el `churro` se encogía solo sin haber sido estirado.
>    - Añade un slider `Imantar / Desimantar (H)` que estire y comprima el `churro` y dibuje en tiempo real el **lazo de histéresis ($B$-$H$)** en el canvas, mostrando la saturación en los extremos y la remanencia (`Memoria`) cuando $H$ vuelve a cero.

---

### Prompt 12: Depuración del Piso XII — «El ovillo que no olvida el desfile» (`12.1` a `12.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso XII (El ovillo que no olvida el desfile — Inductores)** en `magia/magia.js` (`KINDS.tau`, `KINDS.lenz`, `KINDS.freewheel`, `KINDS.sq`).
>
> Corrige las siguientes pifias específicas:
> 1. **`12.1 El desfile no salta` (`KINDS.tau` con variante `L`)**:
>    - Detecta `t.id === "12.1"` o `w.variant === "L"` para configurar el transitorio inductivo $\tau = L / R$ (a mayor resistencia del pasillo $R$, más pequeño es $\tau$ y más rápido cambia el desfile).
> 2. **`12.2 El eco se opone` (`KINDS.lenz` — Ley de Faraday y Lenz)**:
>    - Corrige la pifia crítica donde `nin.x += (silk.x < silk._lx ? 8 : -8)` hacía que el `nin` saliera disparado a $-8\text{ px/frame}$ ($-480\text{ px/s}$) fuera de la pantalla cuando el usuario sostenía el `silk` quieto (`silk.x === silk._lx`).
>    - Calcula la derivada real de la posición del flujo: `const vFlux = silk.x - (silk._lx ?? silk.x);`. El voltaje inducido $e = N \frac{d\Phi}{dt}$ es proporcional a `-vFlux`, de modo que si `vFlux === 0` (el `silk` está quieto, aunque esté agarrado), el `nin` se queda completamente quieto (`e = 0`) y el ovillo calla; si se mueve rápido, el `nin` se desplaza en sentido opuesto a `vFlux` y un medidor muestra la tensión inducida.
> 3. **`12.3 El camino amigo` (`KINDS.freewheel` — Diodo de Rueda Libre)**:
>    - Haz que la ficha `camino amigo` (arco/diodo de rueda libre) sea conmutable (activada/desactivada al hacerle clic) y añade un botón/pieza `Interruptor` en el carril principal.
>    - Cuando las canicas están circulando por el ovillo y se abre el interruptor:
>      - Si el `camino amigo` **no está puesto**, lanza un chispazo de arco eléctrico (`sparks`) en el interruptor por el pico $v = L \frac{di}{dt}$.
>      - Si el `camino amigo` **sí está puesto**, desvía suavemente las canicas hacia el carril secundario (`path: 1`) hasta que pierdan su velocidad sin chispazo.
> 4. **`12.4 El tesoro del ovillo y los ovillos juntos` (`KINDS.sq` con variante `L`)**:
>    - Detecta `t.id === "12.4"` o `w.variant === "L"` para mostrar la energía magnética $W_L = \frac{1}{2} L I^2$ (con monedas que crecen al cuadrado del desfile: $1, 4, 9, 16$) y en `ph >= 2` muestra dos ovillos en serie ($L_T = L_1 + L_2$) y en paralelo ($\frac{1}{L_T} = \frac{1}{L_1} + \frac{1}{L_2}$).

---

### Prompt 13: Depuración del Piso XIII — «El columpio» (`13.1` a `13.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso XIII (El columpio — Corriente Alterna Senoidal)** en `magia/magia.js` (`KINDS.swing`, `KINDS.rms`).
>
> Corrige las siguientes pifias específicas:
> 1. **Reparación del pivote del péndulo y variantes en `KINDS.swing` (`13.1`, `13.2`, `13.3`)**:
>    - Corrige el dibujo de `pendulum` en `drawToy`: en lugar de mover toda la barra vertical horizontalmente, guarda `pc.pivotX` y `pc.pivotY` fijos en el techo (ej. `(640, 140)`) y dibuja la cuerda desde `(pivotX, pivotY)` hasta la lenteja `(pc.x, pc.y)` mientras traza al costado la onda senoidal $\sin(\omega t)$ en tiempo real.
>    - **`13.1 El vaivén y la rueda`**: Vincula la peonza (`top`) que gira en círculo con la sombra del columpio para mostrar cómo una vuelta entera ($2\pi\text{ rad} = 360^\circ$) equivale a un ciclo completo ($f = 1/T$).
>    - **`13.2 Quién va primero` (`t.id === "13.2"` o `variant === "phase"`)**: Dibuja **dos péndulos** y dos ondas senoidales (una roja y una azul) con un slider `desfase (°)` de $-90^\circ$ a $+90^\circ$ para ver quién cruza el centro primero (adelanto vs retraso y $\cos(\theta) = \sin(\theta + 90^\circ)$).
>    - **`13.3 El promedio es cero` (`t.id === "13.3"` o `variant === "avg"`)**: Añade un slider `cojín DC (offset)` de $0$ a $+2$. Con offset $0$, el lóbulo positivo (`arriba`) y el negativo (`abajo`) empatan en la balanza y el promedio es $0$; al subir el cojín DC, el promedio sube al valor del cojín.
> 2. **`13.4 El calor de verdad no es el pico` (`KINDS.rms`)**:
>    - Añade `update()` y un slider `Pico del columpio (Vm)`: compara en vivo el churro alimentado por `río quieto (DC)` frente al churro alimentado por `vaivén (AC)` del mismo pico, mostrando el termómetro/calor en $V_{\text{rms}} = \frac{V_m}{\sqrt{2}} \approx 0,707 \cdot V_m$ y un botón `Igualar calor` que ajuste el pico AC a $\sqrt{2} \approx 1,414$ veces el valor DC.

---

### Prompt 14: Depuración del Piso XIV — «La foto del columpio» (`14.1` a `14.4`)

**Copia y pega esto:**
> Vamos a depurar el **Piso XIV (La foto del columpio — Fasores, Impedancia RLC y Potencia AC)** en `magia/magia.js` (`KINDS.photo`, `KINDS.rlc`, `KINDS.bill`, `KINDS.streets`).
>
> Corrige las siguientes pifias específicas:
> 1. **`14.1 La pendiente y la foto` (`KINDS.photo`)**:
>    - Aplica el pivote fijo del péndulo y dibuja un vector tangente de velocidad (la derivada $\frac{d}{dt}\sin(\omega t) = \omega \cos(\omega t)$) que sea nulo en los extremos del columpio y máximo al cruzar por el centro.
>    - Haz que la `camera` (`PlanToys`) sea clicable: al tocar la cámara, dispara un flash visual, reproduce un sonido de obturador y congela a un lado la **"Foto Fasorial"** (magnitud y ángulo en ese instante).
> 2. **`14.2 Tres amigos en el columpio` (`KINDS.rlc`)**:
>    - En `update()`, anima a los tres ratones Maileg (`Tapón (R)`, `Ovillo (L)`, `Cubo (C)`) oscilando verticalmente junto a la onda del empujón (voltaje):
>      - `Tapón (R)` oscila exactamente en fase ($\Delta\varphi = 0^\circ$).
>      - `Ovillo (L)` tiene su desfile retrasado $90^\circ$ respecto al empujón ($X_L = \omega L$ crece con el slider `música / frecuencia`).
>      - `Cubo (C)` tiene su desfile adelantado $90^\circ$ respecto al empujón ($X_C = \frac{1}{\omega C}$ baja con la frecuencia).
> 3. **`14.3 Solo se factura lo que va a la vez` (`KINDS.bill`)**:
>    - Al mover el slider `ángulo de desfase (φ)` entre $0^\circ$ y $90^\circ$, anima monedas viajando desde la fuente hacia la `caja registradora`:
>      - A $0^\circ$ ($\cos 0^\circ = 1$, carga resistiva), todas las monedas entran a la caja ($P = V_{\text{rms}} I_{\text{rms}}$).
>      - A $90^\circ$ ($\cos 90^\circ = 0$, inductor o capacitor puro), las monedas van y vuelven de la fuente sin quedarse en la caja registradora (potencia reactiva $Q$, potencia media $P = 0$).
> 4. **`14.4 Dos calles o una flecha` (`KINDS.streets`)**:
>    - Añade un segundo slider `largo de la flecha (|Z|)` además de `ángulo (θ)`, o permite arrastrar directamente la punta de la flecha fasorial (`arrow`) por el plano complejo.
>    - Dibuja en vivo las líneas punteadas de proyección sobre la `calle de verdad` (eje real $a = |Z|\cos\theta$) y la `calle de lado` (eje imaginario $+j/-j$, $b = |Z|\sin\theta$), mostrando la equivalencia polar/rectangular $|Z|\angle\theta^\circ = a + jb$ y un botón `Multiplicar por j (+90°)` que rote el fasor $90^\circ$ en sentido antihorario.
