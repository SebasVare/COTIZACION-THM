document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ESTADO DE LA APLICACIÓN
    // ==========================================
    let articulosCotizacion = [];

    // Referencias al DOM
    const inputCotizador = document.getElementById('input-cotizador');
    const inputCliente = document.getElementById('input-cliente');
    const selectIva = document.getElementById('select-iva');
    const lblFolio = document.getElementById('lbl-folio');

    const formArticulo = document.getElementById('form-articulo');
    const inputConcepto = document.getElementById('input-concepto');
    const selectMaterial = document.getElementById('select-material');
    const selectHerraje = document.getElementById('select-herraje');
    const selectLuminaria = document.getElementById('select-luminaria');
    const inputCantidad = document.getElementById('input-cantidad');
    const inputPrecio = document.getElementById('input-precio');

    const tbodyArticulos = document.getElementById('tbody-articulos');
    const lblSubtotal = document.getElementById('lbl-subtotal');
    const lblIva = document.getElementById('lbl-iva');
    const lblTotal = document.getElementById('lbl-total');
    const boxIva = document.getElementById('box-iva');

    const btnMenuNuevo = document.getElementById('btn-menu-nuevo');
    const btnMenuGuardar = document.getElementById('btn-menu-guardar');
    const btnMenuAbrir = document.getElementById('btn-menu-abrir');

    const modalCotizaciones = document.getElementById('modal-cotizaciones');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const listaCotizaciones = document.getElementById('lista-cotizaciones-guardadas');

    const btnExportarPdf = document.getElementById('btn-exportar-pdf');
    const btnExportarExcel = document.getElementById('btn-exportar-excel');

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    inicializar();

    function inicializar() {
        lblFolio.innerText = `Folio: ${obtenerFolioActual(false)}`;
        cargarEstadoLocal();
        selectIva.addEventListener('change', actualizarTablaVisual);
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
    // AGREGAR ARTÍCULO A LA LISTA
    // ==========================================
    formArticulo.addEventListener('submit', (e) => {
        e.preventDefault();

        const conceptoBase = inputConcepto.value.trim();
        const material = selectMaterial.value;
        const herraje = selectHerraje.value;
        const luminaria = selectLuminaria.value;
        const cantidad = parseInt(inputCantidad.value) || 1;
        const precioUnitario = parseFloat(inputPrecio.value) || 0;

        // Detalle de herrajes/materiales integrados
        let detalles = [];
        if (material) detalles.push(`Mat: ${material}`);
        if (herraje) detalles.push(`Herr: ${herraje}`);
        if (luminaria) detalles.push(`Lum: ${luminaria}`);

        const descripcionCompleta = detalles.length > 0 
            ? `${conceptoBase} (${detalles.join(' | ')})` 
            : conceptoBase;

        const nuevoArticulo = {
            id: Date.now(),
            concepto: descripcionCompleta,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: cantidad * precioUnitario
        };

        articulosCotizacion.push(nuevoArticulo);

        // Reset de campos
        inputConcepto.value = '';
        selectMaterial.value = '';
        selectHerraje.value = '';
        selectLuminaria.value = '';
        inputCantidad.value = '1';
        inputPrecio.value = '';
        inputConcepto.focus();

        guardarYActualizar();
    });

    // ==========================================
    // CÁLCULOS Y ACTUALIZACIÓN VISUAL
    // ==========================================
    function guardarYActualizar() {
        localStorage.setItem('articulosCotizacion_actual', JSON.stringify(articulosCotizacion));
        localStorage.setItem('cotizador_nombre', inputCotizador.value);
        localStorage.setItem('cliente_nombre', inputCliente.value);
        actualizarTablaVisual();
    }

    function actualizarTablaVisual() {
        tbodyArticulos.innerHTML = '';
        let subtotalAcumulado = 0;

        articulosCotizacion.forEach((item) => {
            subtotalAcumulado += item.subtotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.cantidad}</strong></td>
                <td>${item.concepto}</td>
                <td>$${item.precioUnitario.toFixed(2)}</td>
                <td><strong>$${item.subtotal.toFixed(2)}</strong></td>
                <td style="text-align: center;"><button class="btn-eliminar-item" data-id="${item.id}">🗑️</button></td>
            `;
            tbodyArticulos.appendChild(tr);
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
        const incluirIva = selectIva.value === 'si';
        const montoIva = incluirIva ? (subtotalAcumulado * 0.16) : 0;
        const totalFinal = subtotalAcumulado + montoIva;

        lblSubtotal.innerText = `$${subtotalAcumulado.toFixed(2)}`;
        lblIva.innerText = `$${montoIva.toFixed(2)}`;
        lblTotal.innerText = `$${totalFinal.toFixed(2)}`;

        boxIva.style.display = incluirIva ? 'flex' : 'none';
    }

    function cargarEstadoLocal() {
        const guardados = localStorage.getItem('articulosCotizacion_actual');
        if (guardados) {
            articulosCotizacion = JSON.parse(guardados);
        }
        inputCotizador.value = localStorage.getItem('cotizador_nombre') || '';
        inputCliente.value = localStorage.getItem('cliente_nombre') || '';
        actualizarTablaVisual();
    }

    // ==========================================
    // MENÚ DE ACCIONES (NUEVO, GUARDAR, ABRIR)
    // ==========================================

    // 1. NUEVA COTIZACIÓN
    btnMenuNuevo.addEventListener('click', () => {
        if (confirm('¿Iniciar nueva cotización? Se limpiarán los datos actuales.')) {
            articulosCotizacion = [];
            localStorage.removeItem('articulosCotizacion_actual');
            inputCliente.value = '';
            lblFolio.removeAttribute('data-folio-activo');
            lblFolio.innerText = `Folio: ${obtenerFolioActual(true)}`;
            actualizarTablaVisual();
        }
    });

    // 2. GUARDAR BORRADOR EN MEMORIA DE LA APP
    btnMenuGuardar.addEventListener('click', () => {
        if (articulosCotizacion.length === 0) {
            alert('No hay artículos para guardar.');
            return;
        }

        const folioActivo = lblFolio.getAttribute('data-folio-activo') || obtenerFolioActual(false);
        const clienteNombre = inputCliente.value.trim() || 'Cliente General';
        const fechaRegistro = new Date().toLocaleDateString('es-MX', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
        });

        const borradorData = {
            id: 'cot_' + Date.now(),
            folio: folioActivo,
            cotizador: inputCotizador.value,
            cliente: clienteNombre,
            incluirIva: selectIva.value,
            fecha: fechaRegistro,
            articulos: articulosCotizacion
        };

        let misBorradores = JSON.parse(localStorage.getItem('mis_borradores_thm') || '[]');

        // Si el folio existe se reemplaza, si no, se agrega al inicio
        const indexExistente = misBorradores.findIndex(b => b.folio === folioActivo);
        if (indexExistente !== -1) {
            misBorradores[indexExistente] = borradorData;
        } else {
            misBorradores.unshift(borradorData);
        }

        localStorage.setItem('mis_borradores_thm', JSON.stringify(misBorradores));
        alert(`✅ Cotización (${folioActivo}) guardada correctamente en la app.`);
    });

    // 3. ABRIR VISOR INTERNO
    btnMenuAbrir.addEventListener('click', () => {
        renderizarListaBorradores();
        modalCotizaciones.style.display = 'flex';
    });

    btnCerrarModal.addEventListener('click', () => {
        modalCotizaciones.style.display = 'none';
    });

    function renderizarListaBorradores() {
        let borradores = JSON.parse(localStorage.getItem('mis_borradores_thm') || '[]');
        listaCotizaciones.innerHTML = '';

        if (borradores.length === 0) {
            listaCotizaciones.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay cotizaciones guardadas en este dispositivo.</p>';
            return;
        }

        borradores.forEach((borrador, index) => {
            const item = document.createElement('div');
            item.className = 'tarjeta-borrador';
            item.innerHTML = `
                <div class="info-borrador">
                    <strong>${borrador.cliente} (${borrador.folio})</strong>
                    <span>${borrador.fecha} • ${borrador.articulos.length} artículo(s)</span>
                </div>
                <div class="acciones-borrador">
                    <button class="btn-cargar-borrador" data-index="${index}">Cargar</button>
                    <button class="btn-eliminar-borrador" data-index="${index}">🗑️</button>
                </div>
            `;
            listaCotizaciones.appendChild(item);
        });

        // Eventos de los botones dentro del modal
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
            inputCotizador.value = datos.cotizador || '';
            inputCliente.value = datos.cliente || '';
            selectIva.value = datos.incluirIva || 'si';

            lblFolio.setAttribute('data-folio-activo', datos.folio);
            lblFolio.innerText = `Folio: ${datos.folio}`;

            guardarYActualizar();
            modalCotizaciones.style.display = 'none';
        }
    }

    // ==========================================
    // EXPORTACIONES
    // ==========================================
    btnExportarPdf.addEventListener('click', () => {
        if (articulosCotizacion.length === 0) {
            alert('Agrega al menos un artículo antes de exportar.');
            return;
        }
        window.print();
    });

    btnExportarExcel.addEventListener('click', () => {
        if (articulosCotizacion.length === 0) {
            alert('Agrega al menos un artículo antes de exportar.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,Cant,Concepto,Precio Unitario,Subtotal\n";
        articulosCotizacion.forEach(row => {
            csvContent += `"${row.cantidad}","${row.concepto}","${row.precioUnitario}","${row.subtotal}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Cotizacion_${inputCliente.value || 'General'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
