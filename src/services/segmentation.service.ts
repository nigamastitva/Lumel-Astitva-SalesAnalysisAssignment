import { PrismaClient } from "@prisma/client";
import { CustomerSegment, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type SegmentationCriteria = {
  minPurchases?: number;
  maxPurchases?: number;
  minRevenue?: number;
  maxRevenue?: number;
  categories?: string[];
  regions?: string[];
  startDate?: Date;
  endDate?: Date;
};

class SegmentationService {
  async createSegment(
    name: string,
    description: string,
    criteria: SegmentationCriteria
  ): Promise<CustomerSegment> {
    return prisma.customerSegment.create({
      data: {
        name,
        description,
        criteria: criteria as Prisma.JsonObject,
      },
    });
  }

  async getCustomersBySegment(
    segmentId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ customers: any[]; total: number }> {
    const segment = await prisma.customerSegment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new Error("Segment not found");
    }

    const criteria = segment.criteria as SegmentationCriteria;
    const { startDate, endDate, ...otherCriteria } = criteria;

    // Base query for filtering by date range
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get customer IDs that match the criteria
    const customerIds = await this.findMatchingCustomerIds(criteria);

    // Get paginated customer details with their order statistics
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { id: { in: customerIds } },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orders: {
            where: {
              dateOfSale: dateFilter,
            },
            select: {
              totalAmount: true,
              quantity: true,
              product: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.customer.count({
        where: { id: { in: customerIds } },
      }),
    ]);

    // Enhance customer data with segmentation metrics
    const enhancedCustomers = customers.map((customer) => {
      const totalSpent = customer.orders.reduce(
        (sum: number, order: { totalAmount: number }) =>
          sum + order.totalAmount,
        0
      );
      const totalOrders = customer.orders.length;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const categories = [
        ...new Set(
          customer.orders.map(
            (order: { product: { category: string } }) => order.product.category
          )
        ),
      ];

      return {
        ...customer,
        totalSpent,
        totalOrders,
        avgOrderValue,
        categories,
      };
    });

    return {
      customers: enhancedCustomers,
      total,
    };
  }

  private async findMatchingCustomerIds(
    criteria: SegmentationCriteria
  ): Promise<string[]> {
    const {
      minPurchases = 0,
      maxPurchases = Infinity,
      minRevenue = 0,
      maxRevenue = Infinity,
      categories = [],
      regions = [],
      startDate,
      endDate,
    } = criteria;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Build the having clause for aggregation
    const having: any = {};
    if (minPurchases > 0 || maxPurchases < Infinity) {
      having.count = {};
      if (minPurchases > 0) having.count.gte = minPurchases;
      if (maxPurchases < Infinity) having.count.lte = maxPurchases;
    }

    if (minRevenue > 0 || maxRevenue < Infinity) {
      having.sum = { totalAmount: {} };
      if (minRevenue > 0) having.sum.totalAmount.gte = minRevenue;
      if (maxRevenue < Infinity) having.sum.totalAmount.lte = maxRevenue;
    }

    // Get customers with their order statistics
    const customers = await prisma.order.groupBy({
      by: ["customerId"],
      where: {
        dateOfSale: dateFilter,
        ...(categories.length > 0 && {
          product: {
            category: { in: categories },
          },
        }),
        ...(regions.length > 0 && {
          region: { in: regions },
        }),
      },
      _count: true,
      _sum: {
        totalAmount: true,
      },
      having,
    });

    // Get full customer IDs from the Customer table
    const customerRecords = await prisma.customer.findMany({
      where: {
        customerId: { in: customers.map((c) => c.customerId) },
      },
      select: { id: true },
    });

    return customerRecords.map((c) => c.id);
  }

  async getSegments(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [segments, total] = await Promise.all([
      prisma.customerSegment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customerSegment.count(),
    ]);

    return {
      data: segments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new SegmentationService();
