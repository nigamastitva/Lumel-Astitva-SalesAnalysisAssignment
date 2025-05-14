import { PrismaClient, Prisma } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { DataRefreshLog } from "@prisma/client";

const prisma = new PrismaClient();
const readFile = promisify(fs.readFile);

class DataImportService {
  async processCSV(filePath: string): Promise<DataRefreshLog> {
    const log = await prisma.dataRefreshLog.create({
      data: {
        status: "started",
        recordsProcessed: 0,
        startedAt: new Date(),
      },
    });

    try {
      const fileContent = await readFile(filePath, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const batchSize = 1000;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await this.processBatch(batch, tx);

          await tx.dataRefreshLog.update({
            where: { id: log.id },
            data: { recordsProcessed: i + batch.length },
          });
        }
      });

      return await prisma.dataRefreshLog.update({
        where: { id: log.id },
        data: {
          status: "success",
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.dataRefreshLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async processBatch(batch: any[], tx: Prisma.TransactionClient) {
    // Process customers first
    const customerData = batch.map((record) => ({
      customerId: record["Customer ID"],
      name: record["Customer Name"],
      email: record["Customer Email"],
      address: record["Customer Address"],
    }));

    await tx.customer.createMany({
      data: customerData,
      skipDuplicates: true,
    });

    // Process products
    const productData = batch.map((record) => ({
      productId: record["Product ID"],
      name: record["Product Name"],
      category: record["Category"],
      unitPrice: parseFloat(record["Unit Price"]),
    }));

    await tx.product.createMany({
      data: productData,
      skipDuplicates: true,
    });

    // Process orders
    const orderData = batch.map((record) => {
      const quantity = parseInt(record["Quantity Sold"]);
      const unitPrice = parseFloat(record["Unit Price"]);
      const discount = parseFloat(record["Discount"]);
      const shippingCost = parseFloat(record["Shipping Cost"]);
      const totalAmount = quantity * unitPrice * (1 - discount) + shippingCost;
      const dateOfSale = new Date(record["Date of Sale"]);

      if (isNaN(dateOfSale.getTime())) {
        throw new Error(`Invalid date format for order ${record["Order ID"]}`);
      }

      return {
        orderId: record["Order ID"],
        customerId: record["Customer ID"],
        productId: record["Product ID"],
        region: record["Region"],
        dateOfSale,
        quantity,
        unitPrice,
        discount,
        shippingCost,
        paymentMethod: record["Payment Method"],
        totalAmount,
      };
    });

    await tx.order.createMany({
      data: orderData,
      skipDuplicates: true,
    });
  }

  async getRefreshLogs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.dataRefreshLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.dataRefreshLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new DataImportService();
