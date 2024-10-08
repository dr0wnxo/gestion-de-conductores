(function () {
    let DB;
    const formulario = document.querySelector('#formulario');

    document.addEventListener('DOMContentLoaded', () => {
        conectarDB();
        formulario.addEventListener('submit', validarConductor);

        if (window.indexedDB.open('crm', 1)) {
            obtenerConductores();
        }

        const listadoConductores = document.querySelector('#listadoConductores');
        if (listadoConductores) {
            listadoConductores.addEventListener('click', eliminarRegistro);
        } else {
            console.error('Elemento #listadoConductores no encontrado');
        }
    });

    function conectarDB() {
        const abrirConexion = window.indexedDB.open('crm', 1);

        abrirConexion.onerror = function () {
            console.log('Hubo un error al conectar la base de datos');
        };

        abrirConexion.onsuccess = function () {
            DB = abrirConexion.result;
        };

        abrirConexion.onupgradeneeded = function (e) {
            const db = e.target.result;
            const objectStore = db.createObjectStore('crm', { keyPath: 'id', autoIncrement: true });

            objectStore.createIndex('nombre', 'nombre', { unique: true });
            objectStore.createIndex('telefono', 'telefono', { unique: false });
            objectStore.createIndex('licencia', 'licencia', { unique: true });
            objectStore.createIndex('emision', 'emision', { unique: false });
            objectStore.createIndex('vence', 'vence', { unique: false });
            objectStore.createIndex('nacimiento', 'nacimiento', { unique: false });
            objectStore.createIndex('foto', 'foto', { unique: false });

            console.log('Base de datos creada');
        };
    }

    function validarConductor(e) {
        e.preventDefault();

        const nombre = document.querySelector('#nombre').value;
        const telefono = document.querySelector('#telefono').value;
        const licencia = document.querySelector('#licencia').value;
        const emision = document.querySelector('#emision').value;
        const vence = document.querySelector('#vence').value;
        const nacimiento = document.querySelector('#nacimiento').value;

        if (nombre === '' || telefono === '' || licencia === '' || emision === '' || vence === '' || nacimiento === '') {
            imprimirAlerta('Todos los campos son obligatorios', 'error');
            return;
        }

        const conductor = {
            nombre,
            telefono,
            licencia,
            emision,
            vence,
            nacimiento,
            id: Date.now()
        };

        crearNuevoConductor(conductor);
    }

    function crearNuevoConductor(conductor) {
        const transaction = DB.transaction(['crm'], 'readwrite');
        const objectStore = transaction.objectStore('crm');

        const request = objectStore.add(conductor);

        request.onsuccess = () => {
            imprimirAlerta('Conductor agregado correctamente', 'exito');
            formulario.reset();
            obtenerConductores();
        };

        request.onerror = () => {
            imprimirAlerta('Hubo un error al agregar el conductor', 'error');
        };
    }
        
        function obtenerConductores() {
            const abrirConexion = window.indexedDB.open('crm', 1);
        
            abrirConexion.onerror = function () {
                console.log('Hubo un error al obtener los conductores');
            };
        
            abrirConexion.onsuccess = function () {
                DB = abrirConexion.result;
        
                const objectStore = DB.transaction('crm').objectStore('crm');
        
                const listadoConductores = document.querySelector('#listadoConductores');
                listadoConductores.innerHTML = '';
        
                const conductores = [];
        
                objectStore.openCursor().onsuccess = function (e) {
                    const cursor = e.target.result;
        
                    if (cursor) {
                        conductores.push(cursor.value);
                        cursor.continue();
                    } else {
                        const ordenarFechas = document.querySelector('#ordenarFechas').value;
                        if (ordenarFechas === 'asc') {
                            conductores.sort((a, b) => new Date(a.vence) - new Date(b.vence));
                        } else {
                            conductores.sort((a, b) => new Date(b.vence) - new Date(a.vence));
                        }
        
                        conductores.forEach(conductor => {
                            const { nombre, telefono, licencia, emision, vence, nacimiento, id } = conductor;
        
                            listadoConductores.innerHTML += `
                                <tr>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                        <p class="text-crema-500">${nombre}</p>
                                    </td>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                        <p class="text-crema-500">${telefono}</p>
                                    </td>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200 leading-5 text-gray-700">
                                        <p class="text-crema-500">${licencia}</p>
                                    </td>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                        <p class="text-crema-500">${emision}</p>
                                    </td>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                        <p class="text-crema-500">${vence}</p>
                                    </td>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                        <p class="text-crema-500">${nacimiento}</p>
                                    </td>
                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5">
                                        <a href="editar-cliente.html?id=${id}" class="text-crema-500 hover:text-teal-900 mr-5">Editar</a>
                                        <a href="#" data-conductor="${id}" class="text-red-600 hover:text-red-900 eliminar">Eliminar</a>
                                    </td>
                                </tr>`;
                        });
                    }
                };
            };
        }

        document.querySelector('#ordenarFechas').addEventListener('change', obtenerConductores);
        

    function eliminarRegistro(e) {
        if (e.target.classList.contains('eliminar')) {
            const idEliminar = Number(e.target.dataset.conductor);

            const confirmar = confirm('¿Deseas eliminar este conductor?');

            if (confirmar) {
                const transaction = DB.transaction(['crm'], 'readwrite');
                const objectStore = transaction.objectStore('crm');

                const request = objectStore.delete(idEliminar);

                request.onsuccess = function () {
                    console.log('Conductor eliminado');
                    e.target.parentElement.parentElement.remove();
                };

                request.onerror = function () {
                    console.log('Hubo un error al eliminar');
                };
            }
        }
    }

    function imprimirAlerta(mensaje, tipo) {
        const alertaExistente = formulario.querySelector('.alerta');
      // Si ya existe una alerta, la removemos antes de crear una nueva
        if (alertaExistente) {
        alertaExistente.remove();
       }

        const divMensaje = document.createElement('div');
        divMensaje.classList.add("px-4", "py-3", "rounded", "max-w-lg", "mx-auto", "mt-6", "text-center");

        if (tipo === 'error') {
            divMensaje.classList.add('bg-red-700', "border-red-700", "text-red-600");
        } else {
            divMensaje.classList.add('bg-green-700', "border-green-700", "text-green-100");
        }

        divMensaje.textContent = mensaje;
        formulario.appendChild(divMensaje);

        setTimeout(() => {
            divMensaje.remove();
        }, 3000);
    }

})()