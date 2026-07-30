document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ESTADO DE LA APLICACIÓN
    // ==========================================
    let articulosCotizacion = [];

    // Referencias al DOM (IDs corregidos según tu HTML original)
    const inputCotizador = document.getElementById('cotizador');
    const inputCliente = document.getElementById('cliente');
    const selectIva = document.getElementById('incluirIva');
    const lblFolio = document.getElementById('folio-cotizacion');

    // Sección Materiales
    const selectGrosorMat = document.getElementById('grosorMaterial');
    const selectMarcaMat = document.getElementById('marcaMaterial');
    const inputCantMat = document.getElementById('cantidadMaterial');
    const inputPrecioMat = document.getElementById('precioMaterial');
    const btnAddMaterial = document.getElementById('btn-agregar-material');

    // Sección Herrajes
    const selectTipoHerraje = document.getElementById('tipoHerraje');
    const inputCantHerraje = document.getElementById('cantidadHerraje');
    const inputPrecioHerraje = document.getElementById('precioHerraje');
    const btnAddHerraje = document.getElementById('btn-agregar-herraje');

    // Sección Luminaria
    const selectTipoLuminaria = document.getElementById('tipoLuminaria');
    const inputCantLuminaria = document.getElementById('cantidadLuminaria');
    const inputPrecioLuminaria = document.getElementById('precioLuminaria');
    const btnAddLuminaria = document.getElementById('btn-agregar-luminaria');

    // Tabla y Totales
    const tablaHistorial = document.getElementById('tablaHistorial')?.querySelector('tbody');
    const lblSubtotal = document.getElementById('lbl-subtotal');
    const lblIva = document.getElementById('lbl-iva');
    const lblTotal = document.getElementById('lbl-total');
    const pIva = document.getElementById('p-iva');

    // Botones del Menú Superior
    const btnMenuNuevo = document.getElementById('btn-menu-nuevo');
    const btnMenuGuardar = document.getElementById('btn-menu-guardar-json');
    const btnMenuAbrir = document.getElementById('btn-menu-abrir');

    // Modal Borradores
    const modalCotizaciones = document.getElementById('modal-cotizaciones');
    const listaCotizaciones = document.getElementById('lista-cotizaciones-guardadas');

    // Exportación
    const btnExportarPdf = document.getElementById('btn-pdf');
    const btnExportarExcel = document.getElementById('btn-excel');

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    inicializar();

    function inicializar() {
        if (lblFolio) lblFolio.innerText = `Folio: ${obtenerFolioActual(false)}`;
        cargarEstadoLocal();
        if (selectIva) selectIva.addEventListener('change', actualizarTablaVisual);
    }

    // ==========================================
    // GENERACIÓN DE FOLIO AUTOMÁTICO
    // ==========================================
    function obtenerFolioActual(forzarNuevo = false) {
        const fecha = new Date();
        const año = fecha.getFullYear().toString().substr(-2);
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const fechaHoy = `${año}${mes}${dia}`;

        let contador = parseInt(localStorage.getItem('cot_contador_' + fechaHoy) || '1');

        if (forzarNuevo) {
            contador += 1;
            localStorage.setItem('cot_contador_' + fechaHoy, contador.toString());
        }

        return `THM-${fechaHoy}-${String(contador).padStart(2, '0')}`;
    }

    // ==========================================
    // AGREGAR ARTÍCULOS POR SECCIÓN
    // ==========================================

    // 1. Agregar Material
    if (btnAddMaterial) {
        btnAddMaterial.addEventListener('click', () => {
            const grosor = selectGrosorMat.value;
            const marca = selectMarcaMat.value;
            const cant = parseInt(inputCantMat.value) || 1;
            const precio = parseFloat(inputPrecioMat.value) || 0;

            const concepto = `Material ${marca} (${grosor})`;
            agregarArticulo(concepto, cant, precio);

            // Reset campos
            inputPrecioMat.value = '';
            inputCantMat.value = '1';
        });
    }

    // 2. Agregar Herraje
    if (btnAddHerraje) {
        btnAddHerraje.addEventListener('click', () => {
            const herraje = selectTipoHerraje.value;
            const cant = parseInt(inputCantHerraje.value) || 1;
            const precio = parseFloat(inputPrecioHerraje.value) || 0;

            const concepto = `Herraje: ${herraje}`;
            agregarArticulo(concepto, cant, precio);

            inputPrecioHerraje.value = '';
            inputCantHerraje.value = '1';
        });
    }

    // 3. Agregar Luminaria
    if (btnAddLuminaria) {
        btnAddLuminaria.addEventListener('click', () => {
            const luminaria = selectTipoLuminaria.value;
            const cant = parseInt(inputCantLuminaria.value) || 1;
            const precio = parseFloat(inputPrecioLuminaria.value) || 0;

            const concepto = `Luminaria: ${luminaria}`;
            agregarArticulo(concepto, cant, precio);

            inputPrecioLuminaria.value = '';
            inputCantLuminaria.value = '1';
        });
    }

    function agregarArticulo(concepto, cantidad, precioUnitario) {
        const nuevoArticulo = {
            id: Date.now(),
            concepto: concepto,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: cantidad * precioUnitario
        };

        articulosCotizacion.push(nuevoArticulo);
        guardarYActualizar();
    }

    // ==========================================
    // CÁLCULOS Y ACTUALIZACIÓN VISUAL
    // ==========================================
    function guardarYActualizar() {
        localStorage.setItem('articulosCotizacion_actual', JSON.stringify(articulosCotizacion));
        if (inputCotizador) localStorage.setItem('cotizador_nombre', inputCotizador.value);
        if (inputCliente) localStorage.setItem('cliente_nombre', inputCliente.value);
        actualizarTablaVisual();
    }

    function actualizarTablaVisual() {
        if (!tablaHistorial) return;
        tablaHistorial.innerHTML = '';

        if (articulosCotizacion.length === 0) {
            tablaHistorial.innerHTML = `<tr id="fila-vacia"><td colspan="5" style="text-align: center; color: #a0aec0;">No hay artículos en la cotización</td></tr>`;
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
                <td class="no-exportar" style="text-align: center;"><button type="button" class="btn-eliminar-item" data-id="${item.id}" style="background:none; border:none; cursor:pointer;">🗑️</button></td>
            `;
            tablaHistorial.appendChild(tr);
        });

        // Eventos para eliminar artículos individuales
        document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                articulosCotizacion = articulosCotizacion.filter(item => item.id !== id);
                guardarYActualizar();
            });
        });

        // Cálculo de IVA y Totales
        const incluirIva = selectIva ? selectIva.value === 'si' : true;
        const montoIva = incluirIva ? (subtotalAcumulado * 0.16) : 0;
        const totalFinal = subtotalAcumulado + montoIva;

        if (lblSubtotal) lblSubtotal.innerText = `$${subtotalAcumulado.toFixed(2)}`;
        if (lblIva) lblIva.innerText = `$${montoIva.toFixed(2)}`;
        if (lblTotal) lblTotal.innerText = `$${totalFinal.toFixed(2)}`;
        if (pIva) pIva.style.display = incluirIva ? 'block' : 'none';
    }

    function cargarEstadoLocal() {
        const guardados = localStorage.getItem('articulosCotizacion_actual');
        if (guardados) {
            articulosCotizacion = JSON.parse(guardados);
        }
        if (inputCotizador) inputCotizador.value = localStorage.getItem('cotizador_nombre') || '';
        if (inputCliente) inputCliente.value = localStorage.getItem('cliente_nombre') || '';
        actualizarTablaVisual();
    }

    // ==========================================
    // MENÚ DE ACCIONES (NUEVO, GUARDAR, ABRIR)
    // ==========================================

    // 1. NUEVA COTIZACIÓN
    if (btnMenuNuevo) {
        btnMenuNuevo.addEventListener('click', () => {
            if (confirm('¿Iniciar nueva cotización? Se limpiarán los datos actuales.')) {
                articulosCotizacion = [];
                localStorage.removeItem('articulosCotizacion_actual');
                if (inputCliente) inputCliente.value = '';
                if (lblFolio) {
                    lblFolio.removeAttribute('data-folio-activo');
                    lblFolio.innerText = `Folio: ${obtenerFolioActual(true)}`;
                }
                actualizarTablaVisual();
            }
        });
    }

    // 2. GUARDAR BORRADOR EN LA MEMORIA DE LA APP
    if (btnMenuGuardar) {
        btnMenuGuardar.addEventListener('click', () => {
            if (articulosCotizacion.length === 0) {
                alert('No hay artículos para guardar.');
                return;
            }

            const folioActivo = lblFolio ? (lblFolio.getAttribute('data-folio-activo') || lblFolio.innerText.replace('Folio: ', '')) : obtenerFolioActual(false);
            const clienteNombre = inputCliente?.value.trim() || 'Cliente General';
            const fechaRegistro = new Date().toLocaleDateString('es-MX', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            });

            const borradorData = {
                id: 'cot_' + Date.now(),
                folio: folioActivo,
                cotizador: inputCotizador?.value || '',
                cliente: clienteNombre,
                incluirIva: selectIva?.value || 'si',
                fecha: fechaRegistro,
                articulos: articulosCotizacion
            };

            let misBorradores = JSON.parse(localStorage.getItem('mis_borradores_thm') || '[]');

            const indexExistente = misBorradores.findIndex(b => b.folio === folioActivo);
            if (indexExistente !== -1) {
                misBorradores[indexExistente] = borradorData;
            } else {
                misBorradores.unshift(borradorData);
            }

            localStorage.setItem('mis_borradores_thm', JSON.stringify(misBorradores));
            alert(`✅ Cotización (${folioActivo}) guardada correctamente en la app.`);
        });
    }

    // 3. ABRIR VISOR INTERNO (MODAL)
    if (btnMenuAbrir) {
        btnMenuAbrir.addEventListener('click', () => {
            renderizarListaBorradores();
            if (modalCotizaciones) modalCotizaciones.style.display = 'flex';
        });
    }

    function renderizarListaBorradores() {
        if (!listaCotizaciones) return;
        let borradores = JSON.parse(localStorage.getItem('mis_borradores_thm') || '[]');
        listaCotizaciones.innerHTML = '';

        if (borradores.length === 0) {
            listaCotizaciones.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay cotizaciones guardadas en este dispositivo.</p>';
            return;
        }

        borradores.forEach((borrador, index) => {
            const item = document.createElement('div');
            item.className = 'tarjeta-borrador';
            item.style.cssText = "background:#f7fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;";
            item.innerHTML = `
                <div class="info-borrador">
                    <strong style="display:block; color:#2d3748;">${borrador.cliente} (${borrador.folio})</strong>
                    <span style="font-size:0.8rem; color:#718096;">${borrador.fecha} • ${borrador.articulos.length} artículo(s)</span>
                </div>
                <div class="acciones-borrador" style="display:flex; gap:6px;">
                    <button type="button" class="btn-cargar-borrador" data-index="${index}" style="background:#3182ce; color:white; border:none; padding:6px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">Cargar</button>
                    <button type="button" class="btn-eliminar-borrador" data-index="${index}" style="background:#e53e3e; color:white; border:none; padding:6px 10px; border-radius:5px; cursor:pointer;">🗑️</button>
                </div>
            `;
            listaCotizaciones.appendChild(item);
        });

        // Eventos para Cargar y Eliminar Borradores
        document.querySelectorAll('.btn-cargar-borrador').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                cargarBorradorDirecto(borradores[idx]);
            });
        });

        document.querySelectorAll('.btn-eliminar-borrador').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                if (confirm('¿Eliminar esta cotización de la memoria?')) {
                    borradores.splice(idx, 1);
                    localStorage.setItem('mis_borradores_thm', JSON.stringify(borradores));
                    renderizarListaBorradores();
                }
            });
        });
    }

    function cargarBorradorDirecto(datos) {
        if (confirm(`¿Cargar la cotización de "${datos.cliente}"?`)) {
            articulosCotizacion = datos.articulos;
            if (inputCotizador) inputCotizador.value = datos.cotizador || '';
            if (inputCliente) inputCliente.value = datos.cliente || '';
            if (selectIva) selectIva.value = datos.incluirIva || 'si';

            if (lblFolio) {
                lblFolio.setAttribute('data-folio-activo', datos.folio);
                lblFolio.innerText = `Folio: ${datos.folio}`;
            }

            guardarYActualizar();
            if (modalCotizaciones) modalCotizaciones.style.display = 'none';
        }
    }

    // Cierre del modal dando clic al botón de cerrar (&times;) o fuera de él
    window.cerrarModalCotizaciones = function() {
        if (modalCotizaciones) modalCotizaciones.style.display = 'none';
    };

    if (modalCotizaciones) {
        modalCotizaciones.addEventListener('click', (e) => {
            if (e.target === modalCotizaciones) cerrarModalCotizaciones();
        });
    }

    // ==========================================
    // EXPORTACIONES
    // ==========================================
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', () => {
            if (articulosCotizacion.length === 0) {
                alert('Agrega al menos un artículo antes de exportar.');
                return;
            }
            window.print();
        });
    }

    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', () => {
            if (articulosCotizacion.length === 0) {
                alert('Agrega al menos un artículo antes de exportar.');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,Concepto,Cantidad,Precio Unitario,Subtotal\n";
            articulosCotizacion.forEach(row => {
                csvContent += `"${row.concepto}","${row.cantidad}","${row.precioUnitario}","${row.subtotal}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Cotizacion_${inputCliente?.value || 'General'}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
