document.addEventListener('DOMContentLoaded', () => {
    const tablaBody = document.querySelector('#tablaHistorial tbody');
    const filaVacia = document.getElementById('fila-vacia');
    const lblFolio = document.getElementById('folio-cotizacion');
    const selectIva = document.getElementById('incluirIva');
    
    // Inputs Principales
    const inputCotizador = document.getElementById('cotizador');
    const inputCliente = document.getElementById('cliente');

    // Menú Superior
    const btnMenuNuevo = document.getElementById('btn-menu-nuevo');
    const btnMenuAbrir = document.getElementById('btn-menu-abrir');
    const btnMenuGuardarJson = document.getElementById('btn-menu-guardar-json');
    const inputAbrirJson = document.getElementById('input-abrir-json');

    // Botones Agregar
    const btnAgregarMaterial = document.getElementById('btn-agregar-material');
    const btnAgregarHerraje = document.getElementById('btn-agregar-herraje');
    const btnAgregarLuminaria = document.getElementById('btn-agregar-luminaria');

    // Exportaciones
    const btnPdf = document.getElementById('btn-pdf');
    const btnExcel = document.getElementById('btn-excel');

    // Totales
    const lblSubtotal = document.getElementById('lbl-subtotal');
    const lblIva = document.getElementById('lbl-iva');
    const lblTotal = document.getElementById('lbl-total');
    const pIva = document.getElementById('p-iva');

    let articulosCotizacion = JSON.parse(localStorage.getItem('articulosCotizacion')) || [];

    function obtenerFolioActual(guardarCambio = false) {
        const fecha = new Date();
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const fechaHoyString = `${dia}${mes}`;

        const ultimaFechaFolio = localStorage.getItem('ultimaFechaFolio') || "";
        let contadorActual = parseInt(localStorage.getItem('contadorFolio')) || 1;

        if (ultimaFechaFolio !== fechaHoyString) {
            contadorActual = 1;
            if (guardarCambio) {
                localStorage.setItem('ultimaFechaFolio', fechaHoyString);
                localStorage.setItem('contadorFolio', contadorActual);
            }
        }

        const contadorFormateado = String(contadorActual).padStart(2, '0');
        const folioGenerado = `${fechaHoyString}${contadorFormateado}`;

        if (guardarCambio) {
            localStorage.setItem('ultimaFechaFolio', fechaHoyString);
            localStorage.setItem('contadorFolio', contadorActual + 1);
        }

        return folioGenerado;
    }

    lblFolio.innerText = `Folio: ${obtenerFolioActual(false)}`;
    actualizarTablaVisual();

    selectIva.addEventListener('change', calcularTotales);

    // ==========================================
    // AGREGAR ARTÍCULOS
    // ==========================================
    btnAgregarMaterial.addEventListener('click', () => {
        const grosor = document.getElementById('grosorMaterial').value;
        const marca = document.getElementById('marcaMaterial').value;
        const cantidad = parseInt(document.getElementById('cantidadMaterial').value);
        const precio = parseFloat(document.getElementById('precioMaterial').value);

        if (isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio < 0) {
            alert('Ingresa una cantidad y precio válidos.');
            return;
        }

        articulosCotizacion.push({
            idInterno: Date.now() + Math.random(),
            descripcion: `Material ${marca} (${grosor})`,
            cantidad: cantidad,
            precioUnitario: precio,
            subtotal: cantidad * precio
        });

        guardarYActualizar();
        document.getElementById('precioMaterial').value = '';
        document.getElementById('cantidadMaterial').value = '1';
    });

    btnAgregarHerraje.addEventListener('click', () => {
        const herraje = document.getElementById('tipoHerraje').value;
        const cantidad = parseInt(document.getElementById('cantidadHerraje').value);
        const precio = parseFloat(document.getElementById('precioHerraje').value);

        if (isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio < 0) {
            alert('Ingresa una cantidad y precio válidos.');
            return;
        }

        articulosCotizacion.push({
            idInterno: Date.now() + Math.random(),
            descripcion: `Herraje: ${herraje}`,
            cantidad: cantidad,
            precioUnitario: precio,
            subtotal: cantidad * precio
        });

        guardarYActualizar();
        document.getElementById('precioHerraje').value = '';
        document.getElementById('cantidadHerraje').value = '1';
    });

    btnAgregarLuminaria.addEventListener('click', () => {
        const luminaria = document.getElementById('tipoLuminaria').value;
        const cantidad = parseInt(document.getElementById('cantidadLuminaria').value);
        const precio = parseFloat(document.getElementById('precioLuminaria').value);

        if (isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio < 0) {
            alert('Ingresa una cantidad y precio válidos.');
            return;
        }

        articulosCotizacion.push({
            idInterno: Date.now() + Math.random(),
            descripcion: `Luminaria: ${luminaria}`,
            cantidad: cantidad,
            precioUnitario: precio,
            subtotal: cantidad * precio
        });

        guardarYActualizar();
        document.getElementById('precioLuminaria').value = '';
        document.getElementById('cantidadLuminaria').value = '1';
    });

    function guardarYActualizar() {
        localStorage.setItem('articulosCotizacion', JSON.stringify(articulosCotizacion));
        actualizarTablaVisual();
    }

    function calcularTotales() {
        let subtotal = 0;
        articulosCotizacion.forEach(art => subtotal += art.subtotal);

        const conIva = selectIva.value === 'si';
        let iva = conIva ? subtotal * 0.16 : 0;
        let total = subtotal + iva;

        lblSubtotal.innerText = `$${subtotal.toFixed(2)}`;
        lblIva.innerText = `$${iva.toFixed(2)}`;
        lblTotal.innerText = `$${total.toFixed(2)}`;

        pIva.style.display = conIva ? 'block' : 'none';

        return { subtotal, iva, total };
    }

    function actualizarTablaVisual() {
        const filasActuales = tablaBody.querySelectorAll('tr:not(#fila-vacia)');
        filasActuales.forEach(f => f.remove());

        if (articulosCotizacion.length > 0) {
            if (filaVacia) filaVacia.style.display = 'none';
        } else {
            if (filaVacia) filaVacia.style.display = 'table-row';
        }

        articulosCotizacion.forEach(art => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${art.descripcion}</strong></td>
                <td>${art.cantidad}</td>
                <td>$${art.precioUnitario.toFixed(2)}</td>
                <td>$${art.subtotal.toFixed(2)}</td>
                <td class="no-exportar"><button type="button" class="btn-delete-row" data-id="${art.idInterno}">✕</button></td>
            `;
            
            tr.querySelector('.btn-delete-row').addEventListener('click', (e) => {
                const idBorrar = parseFloat(e.target.getAttribute('data-id'));
                articulosCotizacion = articulosCotizacion.filter(r => r.idInterno !== idBorrar);
                guardarYActualizar();
            });

            tablaBody.appendChild(tr);
        });

        calcularTotales();
    }

    // ==========================================
    // MENÚ: NUEVO, GUARDAR JSON, ABRIR JSON
    // ==========================================
    btnMenuNuevo.addEventListener('click', () => {
        if (confirm('¿Iniciar nueva cotización? Se limpiará el formulario actual.')) {
            articulosCotizacion = [];
            localStorage.removeItem('articulosCotizacion');
            inputCotizador.value = '';
            inputCliente.value = '';
            lblFolio.removeAttribute('data-folio-activo');
            lblFolio.innerText = `Folio: ${obtenerFolioActual(false)}`;
            actualizarTablaVisual();
        }
    });

    btnMenuGuardarJson.addEventListener('click', () => {
        if (articulosCotizacion.length === 0) {
            alert('No hay datos para guardar.');
            return;
        }

        const datosCotizacion = {
            folio: lblFolio.getAttribute('data-folio-activo') || obtenerFolioActual(false),
            cotizador: inputCotizador.value,
            cliente: inputCliente.value,
            incluirIva: selectIva.value,
            articulos: articulosCotizacion
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datosCotizacion, null, 2));
        const downloadAnchor = document.createElement('a');
        const clienteNombre = inputCliente.value.trim() || 'General';
        
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Borrador_${datosCotizacion.folio}_${clienteNombre.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    btnMenuAbrir.addEventListener('click', () => {
        inputAbrirJson.click();
    });

    inputAbrirJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const datosCargados = JSON.parse(event.target.result);

                if (datosCargados.articulos) {
                    articulosCotizacion = datosCargados.articulos;
                    inputCotizador.value = datosCargados.cotizador || '';
                    inputCliente.value = datosCargados.cliente || '';
                    selectIva.value = datosCargados.incluirIva || 'si';
                    
                    const folioCargado = datosCargados.folio || obtenerFolioActual(false);
                    lblFolio.setAttribute('data-folio-activo', folioCargado);
                    lblFolio.innerText = `Folio: ${folioCargado}`;

                    guardarYActualizar();
                    alert('Cotización cargada correctamente para edición.');
                } else {
                    alert('El archivo JSON no tiene un formato de cotización válido.');
                }
            } catch (err) {
                alert('Error al leer el archivo JSON.');
            }
        };
        reader.readAsText(file);
    });

    // ==========================================
    // EXPORTAR PDF Y EXCEL
    // ==========================================
    btnPdf.addEventListener('click', () => {
        const cliente = inputCliente.value.trim() || 'General';
        const folioParaNombre = lblFolio.getAttribute('data-folio-activo') || obtenerFolioActual(false);

        if (articulosCotizacion.length === 0) {
            alert('La lista está vacía.');
            return;
        }

        const elementoAEmitir = document.getElementById('contenido-cotizacion');
        const opciones = {
            margin:       [8, 8, 8, 8],
            filename:     `Cotizacion_Folio_${folioParaNombre}_${cliente.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        elementoAEmitir.classList.add('exportando-pdf');
        const elementosNoDeseados = document.querySelectorAll('.no-exportar');
        elementosNoDeseados.forEach(el => el.style.setProperty('display', 'none', 'important'));

        html2pdf().set(opciones).from(elementoAEmitir).save().then(() => {
            elementoAEmitir.classList.remove('exportando-pdf');
            elementosNoDeseados.forEach(el => el.style.removeProperty('display'));
        });
    });

    btnExcel.addEventListener('click', () => {
        const cliente = inputCliente.value.trim() || 'General';
        const folioParaNombre = lblFolio.getAttribute('data-folio-activo') || obtenerFolioActual(false);

        if (articulosCotizacion.length === 0) {
            alert('La lista está vacía.');
            return;
        }

        const totales = calcularTotales();
        const filasExcel = articulosCotizacion.map(art => ({
            "Concepto / Descripción": art.descripcion,
            "Cantidad": art.cantidad,
            "Precio Unitario ($)": art.precioUnitario,
            "Subtotal ($)": art.subtotal
        }));

        filasExcel.push({});
        filasExcel.push({ "Concepto / Descripción": "Subtotal:", "Subtotal ($)": totales.subtotal });
        if (selectIva.value === 'si') {
            filasExcel.push({ "Concepto / Descripción": "IVA (16%):", "Subtotal ($)": totales.iva });
        }
        filasExcel.push({ "Concepto / Descripción": "Total General:", "Subtotal ($)": totales.total });

        const hojaTrabajo = XLSX.utils.json_to_sheet(filasExcel);
        const libroTrabajo = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libroTrabajo, hojaTrabajo, "Cotizacion");

        XLSX.writeFile(libroTrabajo, `Cotizacion_Folio_${folioParaNombre}_${cliente.replace(/\s+/g, '_')}.xlsx`);
    });
});