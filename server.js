const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const app = express();
const PORT = 3001;

// Archivos de datos
const CLIENTS_FILE = path.join(__dirname, 'clientes.txt');
const TEMPLATES_FILE = path.join(__dirname, 'plantillas_servicios.json');
const APPLICATIONS_FILE = path.join(__dirname, 'aplicaciones.txt');

// Configuración de CORS
app.use(cors());
app.use(express.json());

// Función para leer clientes del archivo
function getClients() {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) {
      fs.writeFileSync(CLIENTS_FILE, 'Cliente 1\nCliente 2\nCliente 3');
    }
    const content = fs.readFileSync(CLIENTS_FILE, 'utf8');
    return content.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error('Error leyendo clientes:', error);
    return [];
  }
}

// Función para guardar clientes
function saveClients(clients) {
  try {
    fs.writeFileSync(CLIENTS_FILE, clients.join('\n'));
    return true;
  } catch (error) {
    console.error('Error guardando clientes:', error);
    return false;
  }
}

// ============ FUNCIONES PARA APLICACIONES ============

function getApplications() {
  try {
    if (!fs.existsSync(APPLICATIONS_FILE)) {
      fs.writeFileSync(APPLICATIONS_FILE, 'SAP\nSalesforce\nPortal Web\nCRM\nERP');
    }
    const content = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
    return content.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error('Error leyendo aplicaciones:', error);
    return [];
  }
}

function saveApplications(applications) {
  try {
    fs.writeFileSync(APPLICATIONS_FILE, applications.join('\n'));
    return true;
  } catch (error) {
    console.error('Error guardando aplicaciones:', error);
    return false;
  }
}

// ============ FUNCIONES PARA PLANTILLAS DE SERVICIOS ============

function getServiceTemplates() {
  try {
    if (!fs.existsSync(TEMPLATES_FILE)) {
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify([]));
    }
    const content = fs.readFileSync(TEMPLATES_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error leyendo plantillas:', error);
    return [];
  }
}

function saveServiceTemplates(templates) {
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
    return true;
  } catch (error) {
    console.error('Error guardando plantillas:', error);
    return false;
  }
}

// ============ ENDPOINTS PARA CLIENTES ============

app.get('/clients', (req, res) => {
  const clients = getClients();
  res.json({ success: true, clients });
});

app.post('/clients', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre del cliente es requerido' });
  }
  
  const clients = getClients();
  clients.push(name.trim());
  
  if (saveClients(clients)) {
    res.json({ success: true, clients });
  } else {
    res.status(500).json({ error: 'Error al guardar el cliente' });
  }
});

app.delete('/clients/:name', (req, res) => {
  const { name } = req.params;
  const clients = getClients();
  const filtered = clients.filter(c => c !== name);
  
  if (saveClients(filtered)) {
    res.json({ success: true, clients: filtered });
  } else {
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
});

// ============ ENDPOINTS PARA APLICACIONES ============

app.get('/applications', (req, res) => {
  const applications = getApplications();
  res.json({ success: true, applications });
});

app.post('/applications', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre de la aplicación es requerido' });
  }
  
  const applications = getApplications();
  
  // Evitar duplicados
  if (applications.includes(name.trim())) {
    return res.status(400).json({ error: 'Esta aplicación ya existe' });
  }
  
  applications.push(name.trim());
  
  if (saveApplications(applications)) {
    res.json({ success: true, applications });
  } else {
    res.status(500).json({ error: 'Error al guardar la aplicación' });
  }
});

app.delete('/applications/:name', (req, res) => {
  const { name } = req.params;
  const applications = getApplications();
  const filtered = applications.filter(a => a !== name);
  
  if (saveApplications(filtered)) {
    res.json({ success: true, applications: filtered });
  } else {
    res.status(500).json({ error: 'Error al eliminar la aplicación' });
  }
});

// ============ ENDPOINTS PARA PLANTILLAS DE SERVICIOS ============

app.get('/service-templates', (req, res) => {
  const templates = getServiceTemplates();
  res.json({ success: true, templates });
});

app.post('/service-templates', (req, res) => {
  const { serviceName, distribution } = req.body;
  
  if (!serviceName || !serviceName.trim()) {
    return res.status(400).json({ error: 'El nombre del servicio es requerido' });
  }
  
  if (!distribution || !Array.isArray(distribution)) {
    return res.status(400).json({ error: 'La distribución debe ser un array' });
  }
  
  // Validar que la suma sea 100%
  const total = distribution.reduce((sum, d) => sum + (d.percentage || 0), 0);
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({ error: `La distribución debe sumar 100% (actual: ${total}%)` });
  }
  
  const templates = getServiceTemplates();
  const existingIndex = templates.findIndex(t => t.serviceName === serviceName.trim());
  
  const newTemplate = {
    serviceName: serviceName.trim(),
    distribution: distribution.filter(d => d.client && d.percentage > 0)
  };
  
  if (existingIndex >= 0) {
    templates[existingIndex] = newTemplate;
  } else {
    templates.push(newTemplate);
  }
  
  if (saveServiceTemplates(templates)) {
    res.json({ success: true, templates });
  } else {
    res.status(500).json({ error: 'Error al guardar la plantilla' });
  }
});

app.delete('/service-templates/:serviceName', (req, res) => {
  const { serviceName } = req.params;
  const templates = getServiceTemplates();
  const filtered = templates.filter(t => t.serviceName !== serviceName);
  
  if (saveServiceTemplates(filtered)) {
    res.json({ success: true, templates: filtered });
  } else {
    res.status(500).json({ error: 'Error al eliminar la plantilla' });
  }
});

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// Endpoint para subir y procesar el CSV
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }

  const filePath = req.file.path;

  try {
    // Leer el archivo completo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parsear con PapaParse con configuración robusta
    const parsed = Papa.parse(fileContent, {
      skipEmptyLines: true,
      dynamicTyping: false,
      header: false,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ','
    });

    if (!parsed.data || parsed.data.length < 2) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'El archivo CSV no contiene suficientes datos' });
    }

    // Buscar la fila con más columnas (probablemente el header real)
    let headerRowIndex = 0;
    let maxColumns = 0;
    
    for (let i = 0; i < Math.min(5, parsed.data.length); i++) {
      const columnCount = parsed.data[i].filter(col => col && col.trim() !== '').length;
      if (columnCount > maxColumns) {
        maxColumns = columnCount;
        headerRowIndex = i;
      }
    }

    // Obtener los headers
    const headers = parsed.data[headerRowIndex].map(h => h ? h.trim() : '');
    
    // Filtrar headers vacíos y obtener datos
    const validHeaders = headers.filter(h => h !== '');
    const dataRows = [];

    for (let i = headerRowIndex + 1; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      
      // Crear objeto con los datos
      const rowData = {};
      let hasData = false;
      
      for (let j = 0; j < validHeaders.length; j++) {
        let value = row[j] ? row[j].trim() : '';
        
        // Redondear columnas de costos a 2 decimales
        if (['Original Cost', 'Cost', 'Volume Cost', 'Volume Discount'].includes(validHeaders[j]) && value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            value = numValue.toFixed(2);
          }
        }
        
        rowData[validHeaders[j]] = value;
        if (value !== '') hasData = true;
      }
      
      // Filtrar filas basura
      const serviceName = rowData['Service Name'] || '';
      const isBadRow = serviceName.includes('--this is the end') || 
                       serviceName.includes('end of report') ||
                       serviceName.trim() === '';
      
      // Solo agregar filas válidas que tengan datos
      if (hasData && !isBadRow) {
        dataRows.push(rowData);
      }
    }

    // Eliminar el archivo después de procesarlo
    fs.unlinkSync(filePath);

    if (dataRows.length === 0) {
      return res.status(400).json({ 
        error: 'No se encontraron datos válidos en el CSV' 
      });
    }

    console.log(`CSV procesado: ${dataRows.length} filas, ${validHeaders.length} columnas`);

    res.json({
      success: true,
      data: dataRows,
      columns: validHeaders,
      rowCount: dataRows.length
    });

  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Error al procesar CSV:', error);
    res.status(500).json({ 
      error: 'Error al procesar el archivo CSV: ' + error.message 
    });
  }
});

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Servidor CSV funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});