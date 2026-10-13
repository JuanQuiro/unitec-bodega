import ExcelJS from 'exceljs';

// GET /api/import/plantilla — plantilla vacía con ejemplo para carga masiva.
export async function GET() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mi Bodega';
  const sheet = workbook.addWorksheet('Productos');
  sheet.columns = [
    { header: 'Producto', key: 'nombre', width: 36 },
    { header: 'Categoría', key: 'categoria', width: 16 },
    { header: 'Unidad', key: 'unidad', width: 12 },
    { header: 'Precio (Bs.)', key: 'precio', width: 16 },
    { header: 'Costo (Bs.)', key: 'costo', width: 16 },
    { header: 'Stock', key: 'stock', width: 10 },
  ];
  sheet.addRow({
    nombre: 'Arroz 1kg (ejemplo, borrar)',
    categoria: 'viveres',
    unidad: 'unidad',
    precio: 78,
    costo: 60,
    stock: 40,
  });
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-productos.xlsx"',
    },
  });
}
