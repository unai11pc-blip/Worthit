# WorthIt — MVP

Una web local para pensar una compra antes de hacerla. No necesita cuenta, servidor ni instalaciones: tus datos se guardan solo en el navegador mediante `localStorage`.

## Qué incluye ahora

Esta primera versión resuelve una decisión concreta: **"¿me compensa comprar esto si lo voy a usar así?"**

Incluye:

- Formulario de producto: nombre, categoría, precio, usos esperados al mes y duración estimada.
- Preguntas para detectar duplicados, urgencia, necesidad real y qué producto reemplaza.
- Coste por uso, amortización mensual y anual.
- Veredicto razonado, tres decisiones posibles y una comprobación conservadora (un 25 % menos de uso).
- Presupuesto mensual opcional para ver cuánto peso tiene la compra en tu mes.
- Lista de deseos con fechas de revisión automáticas: 48 horas al esperar, una semana para buscar alternativa y un mes tras decidir comprar.
- Comparador de hasta tres productos guardados.
- Seguimiento de usos reales después de comprar, con una lectura simple de intención frente a realidad.
- Lista de deseos que persiste al cerrar el navegador, sin registro.
- Diseño responsive para móvil y escritorio.

No incluye todavía comparación automática de precios de tiendas, enlaces de compra, IA generativa ni sincronización entre dispositivos. Esas funciones solo merecen añadirse cuando la gente use y guarde análisis de forma habitual.

## Cómo abrirla

1. Abre `index.html` con doble clic.
2. Escribe una compra y selecciona **Ver mi decisión**.
3. Elige si comprar, esperar o buscar una alternativa, y guarda la decisión.
4. Selecciona dos o tres elementos guardados para compararlos.
5. Si compras algo, pulsa **La compré** y registra cada uso real.

También puedes abrir la carpeta en VS Code y utilizar una extensión de servidor local, aunque no es necesaria.

## Por qué esta tecnología

- **HTML** estructura la página.
- **CSS** crea toda la apariencia premium y el diseño adaptable.
- **JavaScript puro** realiza los cálculos y el guardado local.

Es la opción más sencilla para empezar: hay solo tres archivos, no hay dependencias que instalar y cada pieza se puede entender por separado. Cuando el proyecto valide la idea, se puede migrar a React/Next.js y añadir una base de datos con cuentas.

## Lógica del veredicto

`coste por uso = precio / (usos al mes × meses de duración)`

El veredicto usa ese resultado junto con el uso mensual y la vida útil prevista. No pretende ser una recomendación financiera: sirve para hacer visible la suposición que hay detrás de una compra.

## Próximos pasos sugeridos

1. Pide a cinco personas que analicen una compra real en su móvil.
2. Anota qué pregunta hace que cambien de decisión y cuál ignoran.
3. Comprueba si usan de verdad el temporizador y el seguimiento de usos.
4. Cuando haya uso recurrente, incorpora una cuenta opcional para sincronizar la lista.
