document.addEventListener('DOMContentLoaded', () => {

    let articulosCotizacion = [];

    // Referencias al DOM
    const inputCotizador = document.getElementById('cotizador');
    const inputCliente = document.getElementById('cliente');
    const selectIva = document.getElementById('select-iva');
    const lblFolio = document.getElementById('lbl-folio');

    // Materiales
    const selectGrosorMat = document.getElementById('grosorMaterial');
    const selectMarcaMat = document.getElementById('marcaMaterial');
    const inputCantMat = document.getElementById('cantidadMaterial');
    const inputPrecioMat = document.getElementById('precioMaterial');
    const btnAddMaterial = document.getElementById('btn-agregar-material');

    // Herrajes
    const selectTipoHerraje = document.getElementById('tipoHerraje');
    const inputCantHerraje = document.getElementById('cantidadHerraje');
    const inputPrecioHerraje = document.getElementById('precioHerraje');
    const btnAddHerraje = document.getElementById('btn-agregar-herraje');

    // Luminarias
    const selectTipoLuminaria = document.getElementById('tipoLuminaria');
    const inputCantLuminaria = document.getElementById('cantidadLuminaria');
    const inputPrecioLuminaria = document.getElementById('precioLuminaria');
    const btnAddLuminaria = document.getElementById('btn-agregar-luminaria');

    // Tabla & Totales
    const tbodyArticulos = document.getElementById('tbody-articulos');
    const lblSubtotal = document.getElementById('lbl-subtotal');
    const lblIva = document.getElementById('lbl-iva');
    const lblTotal = document.getElementById('lbl-total');
    const boxIva = document.getElementById('box-iva');

    // Acciones Menú Superior & Modal
    const btnMenuNuevo = document.getElementById('btn-menu-nuevo');
    const btnMenuGuardar = document.getElementById('btn-menu-guardar');
    const btnMenuAbrir = document.getElementById('btn-menu-abrir');
    const modalLista = document.getElementById('modal-lista');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const contenedorLista = document.getElementById('contenedor-lista-guardados');

    // Exportación
    const btnExportarPdf = document.getElementById('btn-pdf');
    const btnExportarExcel = document.getElementById('btn-excel');

    // Inicialización del Folio y Estado
    if (lblFolio) lblFolio.innerText = `Folio: ${obtenerFolioActual(false)}`;
    cargarEstadoLocal();
    if (selectIva) selectIva.addEventListener('change', actualizarTablaVisual);

    // Guardar cambios en los campos de texto principales al escribir
    if (inputCotizador) inputCotizador.addEventListener('input', guardarYActualizar);
    if (inputCliente) inputCliente.addEventListener('input', guardarYActualizar);

    // FORMATO DE FOLIO DE CORRIDO SIN DIAGONALES: diamesnumero (Ejemplo: 300701)
    function obtenerFolioActual(forzarNuevo = false) {
        const fecha = new Date();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const claveDia = `${dia}${mes}`;

        let contador = parseInt(localStorage.getItem('cot_contador_' + claveDia) || '1');

        if (forzarNuevo) {
            contador += 1;
            localStorage.setItem('cot_contador_' + claveDia, contador.toString());
        }

        const numCotizacion = String(contador).padStart(2, '0');
        return `${dia}${mes}${numCotizacion}`;
    }

    // Agregar Artículos - Material
    if (btnAddMaterial) {
        btnAddMaterial.addEventListener('click', () => {
            const concepto = `Material ${selectMarcaMat.value} (${selectGrosorMat.value})`;
            const cant = parseInt(inputCantMat.value) || 1;
            const precio = parseFloat(inputPrecioMat.value) || 0;
            agregarArticulo(concepto, cant, precio);
            inputPrecioMat.value = '';
            inputCantMat.value = '1';
        });
    }

    // Agregar Artículos - Herraje
    if (btnAddHerraje) {
        btnAddHerraje.addEventListener('click', () => {
            const concepto = `Herraje: ${selectTipoHerraje.value}`;
            const cant = parseInt(inputCantHerraje.value) || 1;
            const precio = parseFloat(inputPrecioHerraje.value) || 0;
            agregarArticulo(concepto, cant, precio);
            inputPrecioHerraje.value = '';
            inputCantHerraje.value = '1';
        });
    }

    // Agregar Artículos - Luminaria
    if (btnAddLuminaria) {
        btnAddLuminaria.addEventListener('click', () => {
            const concepto = `Luminaria: ${selectTipoLuminaria.value}`;
            const cant = parseInt(inputCantLuminaria.value) || 1;
            const precio = parseFloat(inputPrecioLuminaria.value) || 0;
            agregarArticulo(concepto, cant, precio);
            inputPrecioLuminaria.value = '';
            inputCantLuminaria.value = '1';
        });
    }

    function agregarArticulo(concepto, cantidad, precioUnitario) {
        articulosCotizacion.push({
            id: Date.now(),
            concepto: concepto,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: cantidad * precioUnitario
        });
        guardarYActualizar();
    }

    function guardarYActualizar() {
        localStorage.setItem('articulosCotizacion_actual', JSON.stringify(articulosCotizacion));
        if (inputCotizador) localStorage.setItem('cotizador_nombre', inputCotizador.value);
        if (inputCliente) localStorage.setItem('cliente_nombre', inputCliente.value);
        actualizarTablaVisual();
    }

    function actualizarTablaVisual() {
        if (!tbodyArticulos) return;
        tbodyArticulos.innerHTML = '';

        if (articulosCotizacion.length === 0) {
            tbodyArticulos.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #718096;">No hay artículos agregados</td></tr>`;
            if (lblSubtotal) lblSubtotal.innerText = '$0.00';
            if (lblIva) lblIva.innerText = '$0.00';
            if (lblTotal) lblTotal.innerText = '$0.00';
            return;
        }

        let subtotalAcumulado = 0;

        articulosCotizacion.forEach((item) => {
            subtotalAcumulado += item.subtotal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.concepto}</td>
                <td><strong>${item.cantidad}</strong></td>
                <td>$${item.precioUnitario.toFixed(2)}</td>
                <td><strong>$${item.subtotal.toFixed(2)}</strong></td>
                <td class="no-exportar" style="text-align: center;">
                    <button type="button" class="btn-delete-row" data-id="${item.id}">🗑️</button>
                </td>
            `;
            tbodyArticulos.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                articulosCotizacion = articulosCotizacion.filter(item => item.id !== id);
                guardarYActualizar();
            });
        });

        const incluirIva = selectIva ? selectIva.value === 'si' : true;
        const montoIva = incluirIva ? (subtotalAcumulado * 0.16) : 0;
        const totalFinal = subtotalAcumulado + montoIva;

        if (lblSubtotal) lblSubtotal.innerText = `$${subtotalAcumulado.toFixed(2)}`;
        if (lblIva) lblIva.innerText = `$${montoIva.toFixed(2)}`;
        if (lblTotal) lblTotal.innerText = `$${totalFinal.toFixed(2)}`;
        if (boxIva) boxIva.style.display = incluirIva ? 'block' : 'none';
    }

    function cargarEstadoLocal() {
        const guardados = localStorage.getItem('articulosCotizacion_actual');
        if (guardados) articulosCotizacion = JSON.parse(guardados);
        if (inputCotizador) inputCotizador.value = localStorage.getItem('cotizador_nombre') || '';
        if (inputCliente) inputCliente.value = localStorage.getItem('cliente_nombre') || '';
        actualizarTablaVisual();
    }

    // SISTEMA INTERNO DE GUARDADO DE COTIZACIONES
    function obtenerCotizacionesGuardadas() {
        return JSON.parse(localStorage.getItem('cotizaciones_guardadas_app') || '[]');
    }

    if (btnMenuGuardar) {
        btnMenuGuardar.addEventListener('click', () => {
            if (articulosCotizacion.length === 0) {
                alert('Agrega al menos un artículo antes de guardar.');
                return;
            }

            const clienteNombre = inputCliente ? inputCliente.value.trim() || 'Cliente Sin Nombre' : 'Cliente Sin Nombre';
            const folioTexto = lblFolio ? lblFolio.innerText.replace('Folio: ', '') : obtenerFolioActual();
            const totalTexto = lblTotal ? lblTotal.innerText : '$0.00';

            let listaGuardadas = obtenerCotizacionesGuardadas();

            const nuevaCotizacion = {
                id: folioTexto,
                fecha: new Date().toLocaleDateString('es-MX'),
                folio: folioTexto,
                cotizador: inputCotizador ? inputCotizador.value : '',
                cliente: clienteNombre,
                incluirIva: selectIva ? selectIva.value : 'si',
                articulos: articulosCotizacion,
                total: totalTexto
            };

            const indiceExistente = listaGuardadas.findIndex(c => c.folio === folioTexto);
            if (indiceExistente !== -1) {
                listaGuardadas[indiceExistente] = nuevaCotizacion;
            } else {
                listaGuardadas.push(nuevaCotizacion);
            }

            localStorage.setItem('cotizaciones_guardadas_app', JSON.stringify(listaGuardadas));
            alert(`✅ Cotización "${folioTexto}" de (${clienteNombre}) guardada en la app.`);
        });
    }

    if (btnMenuAbrir) {
        btnMenuAbrir.addEventListener('click', () => {
            renderizarListaModal();
            if (modalLista) modalLista.classList.add('activo');
        });
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            if (modalLista) modalLista.classList.remove('activo');
        });
    }

    function renderizarListaModal() {
        if (!contenedorLista) return;
        const lista = obtenerCotizacionesGuardadas();
        contenedorLista.innerHTML = '';

        if (lista.length === 0) {
            contenedorLista.innerHTML = `<p style="text-align: center; color: #718096; padding: 20px;">No tienes cotizaciones guardadas aún.</p>`;
            return;
        }

        lista.forEach(cot => {
            const div = document.createElement('div');
            div.className = 'tarjeta-cotizacion';
            div.innerHTML = `
                <div class="info-cotizacion">
                    <strong>${cot.cliente}</strong>
                    <span>Folio: ${cot.folio} | Fecha: ${cot.fecha} | Total: ${cot.total}</span>
                </div>
                <div class="acciones-cotizacion">
                    <button type="button" class="btn-cargar-cot" data-folio="${cot.folio}">Cargar</button>
                    <button type="button" class="btn-borrar-cot" data-folio="${cot.folio}">🗑️</button>
                </div>
            `;
            contenedorLista.appendChild(div);
        });

        document.querySelectorAll('.btn-cargar-cot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const folio = e.target.getAttribute('data-folio');
                const cot = lista.find(item => item.folio === folio);
                if (cot) {
                    articulosCotizacion = cot.articulos;
                    if (inputCotizador) inputCotizador.value = cot.cotizador || '';
                    if (inputCliente) inputCliente.value = cot.cliente || '';
                    if (selectIva) selectIva.value = cot.incluirIva || 'si';
                    if (lblFolio) lblFolio.innerText = `Folio: ${cot.folio}`;
                    guardarYActualizar();
                    if (modalLista) modalLista.classList.remove('activo');
                }
            });
        });

        document.querySelectorAll('.btn-borrar-cot').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const folio = e.target.getAttribute('data-folio');
                if (confirm(`¿Eliminar la cotización ${folio}?`)) {
                    let listaActualizada = obtenerCotizacionesGuardadas().filter(item => item.folio !== folio);
                    localStorage.setItem('cotizaciones_guardadas_app', JSON.stringify(listaActualizada));
                    renderizarListaModal();
                }
            });
        });
    }

    if (btnMenuNuevo) {
        btnMenuNuevo.addEventListener('click', () => {
            if (confirm('¿Iniciar nueva cotización? Se limpiará el formulario.')) {
                articulosCotizacion = [];
                localStorage.removeItem('articulosCotizacion_actual');
                if (inputCliente) inputCliente.value = '';
                if (lblFolio) lblFolio.innerText = `Folio: ${obtenerFolioActual(true)}`;
                actualizarTablaVisual();
            }
        });
    }

    // Exportación
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', () => {
            if (articulosCotizacion.length === 0) return alert('Agrega al menos un artículo.');
            window.print();
        });
    }

    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', () => {
            if (articulosCotizacion.length === 0) return alert('Agrega al menos un artículo.');
            let csv = "Concepto,Cantidad,Precio Unitario,Subtotal\n";
            articulosCotizacion.forEach(r => {
                csv += `"${r.concepto}","${r.cantidad}","${r.precioUnitario}","${r.subtotal}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            const clienteStr = inputCliente ? inputCliente.value : 'General';
            link.download = `Cotizacion_${clienteStr || 'General'}.csv`;
            link.click();
        });
    }
});
