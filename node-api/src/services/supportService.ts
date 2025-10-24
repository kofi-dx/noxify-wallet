import { SupportTicket, TicketMessage, User, Admin, Payment, KYCApplication } from '../models';
import adminService from './adminService';

export class SupportService {
  /**
   * Create new support ticket
   */
async createSupportTicket(
  userId: string,
  data: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
  }
): Promise<SupportTicket> {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove AI priority assignment - use simple logic instead
    let priority = data.priority as any;
    if (!priority) {
      priority = this.assignPriority(data.category, data.subject);
    }

    const ticket = await SupportTicket.create({
      userId,
      category: data.category as any,
      subject: data.subject,
      description: data.description,
      priority,
      status: 'open',
      tags: this.generateInitialTags(data.category, data.subject)
    });


    return ticket;
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }
}

private assignPriority(category: string, subject: string): 'low' | 'medium' | 'high' | 'urgent' {
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('urgent') || subjectLower.includes('emergency')) {
    return 'urgent';
  }
  
  if (category === 'payment_issue' || category === 'dispute') {
    return 'high';
  }
  
  if (category === 'account_issue') {
    return 'medium';
  }
  
  return 'low';
}

  /**
   * Add message to ticket
   */
  async addTicketMessage(
    ticketId: string,
    senderId: string,
    senderType: 'user' | 'admin' | 'ai',
    message: string,
    messageType: string = 'text',
    isInternal: boolean = false,
    attachments?: string[]
  ): Promise<TicketMessage> {
    try {
      const ticket = await SupportTicket.findByPk(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Update ticket status if needed
      if (senderType === 'admin' && ticket.status === 'open') {
        await ticket.update({ status: 'in_progress' });
      }

      const ticketMessage = await TicketMessage.create({
        ticketId,
        senderId,
        senderType,
        message,
        messageType: messageType as any,
        isInternal,
        attachments
      });

      // Generate AI follow-up if user sent message and ticket is not resolved
      if (senderType === 'user' && ticket.status !== 'resolved') {
        await this.generateAIResponse(ticket, ticketMessage);
      }

      return ticketMessage;
    } catch (error: any) {
      console.error('Error adding ticket message:', error);
      throw new Error(`Failed to add ticket message: ${error.message}`);
    }
  }

  /**
   * Generate AI response to user messages
   */
  private async generateAIResponse(ticket: SupportTicket, userMessage: TicketMessage): Promise<void> {
    try {
      const user = await User.findByPk(ticket.userId);
      if (!user) return;

      const recentMessages = await TicketMessage.findAll({
        where: { ticketId: ticket.id },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      const conversationContext = recentMessages
        .reverse()
        .map(msg => `${msg.senderType}: ${msg.message}`)
        .join('\n');

      // Simple AI response for common queries
      const prompt = `
        User Issue: ${ticket.subject}
        Conversation History:
        ${conversationContext}
        
        Current User Message: ${userMessage.message}
        
        Provide a helpful, concise response to assist the user. If the issue requires admin intervention, acknowledge this and set expectations.
      `;

      // In a real implementation, you would call your AI service here
      // For now, we'll use a simple response generator
      const aiResponse = this.generateSimpleAIResponse(ticket.category, userMessage.message);
      
      if (aiResponse) {
        await this.addTicketMessage(
          ticket.id,
          'ai-assistant',
          'ai',
          aiResponse,
          'text',
          false
        );
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  /**
   * Simple AI response generator (fallback)
   */
  private generateSimpleAIResponse(category: string, userMessage: string): string | null {
    const message = userMessage.toLowerCase();
    
    if (message.includes('status') || message.includes('update')) {
      return "I understand you're looking for an update. Let me check the current status and get back to you shortly.";
    }
    
    if (message.includes('when') || message.includes('how long')) {
      return "Processing times vary depending on the issue. Our team is working on it and we'll provide updates as soon as possible.";
    }
    
    if (message.includes('thank') || message.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    if (message.includes('urgent') || message.includes('emergency')) {
      return "I've noted the urgency of your request. Our team will prioritize your ticket.";
    }
    
    return "Thank you for the additional information. Our support team will review this and get back to you with next steps.";
  }

  /**
   * Assign ticket to admin
   */
  async assignTicketToAdmin(ticketId: string, adminId: string): Promise<SupportTicket> {
    try {
      const ticket = await SupportTicket.findByPk(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      await ticket.update({
        assignedTo: adminId,
        status: 'in_progress'
      });

      // Add system message
      await this.addTicketMessage(
        ticketId,
        'system',
        'ai',
        `Ticket assigned to ${admin.role}`,
        'system',
        true
      );

      return ticket;
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      throw new Error(`Failed to assign ticket: ${error.message}`);
    }
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(ticketId: string, adminId: string, resolution: string): Promise<SupportTicket> {
    try {
      const ticket = await SupportTicket.findByPk(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      await ticket.update({
        status: 'resolved',
        resolution,
        resolvedAt: new Date()
      });

      // Add resolution message
      await this.addTicketMessage(
        ticketId,
        adminId,
        'admin',
        `Issue resolved: ${resolution}`,
        'resolution',
        false
      );

      // Log admin action
      await adminService.logAdminAction(adminId, 'resolve_ticket', 'ticket', ticketId, {
        resolution
      });

      return ticket;
    } catch (error: any) {
      console.error('Error resolving ticket:', error);
      throw new Error(`Failed to resolve ticket: ${error.message}`);
    }
  }

  /**
   * Get tickets with filters
   */
  async getTickets(filters: {
    status?: string;
    category?: string;
    priority?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tickets: SupportTicket[]; total: number }> {
    try {
      const where: any = {};
      
      if (filters.status) where.status = filters.status;
      if (filters.category) where.category = filters.category;
      if (filters.priority) where.priority = filters.priority;
      if (filters.assignedTo) where.assignedTo = filters.assignedTo;

      const result = await SupportTicket.findAndCountAll({
        where,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName']
          },
          {
            model: Admin,
            as: 'assignedAdmin',
            attributes: ['id', 'role'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }
        ]
      });

      return {
        tickets: result.rows,
        total: result.count
      };
    } catch (error: any) {
      console.error('Error getting tickets:', error);
      throw new Error(`Failed to get tickets: ${error.message}`);
    }
  }

  /**
   * Get ticket with full conversation
   */
  async getTicketWithConversation(ticketId: string): Promise<SupportTicket | null> {
    try {
      return await SupportTicket.findByPk(ticketId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'kycStatus']
          },
          {
            model: Admin,
            as: 'assignedAdmin',
            attributes: ['id', 'role'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: TicketMessage,
            as: 'messages',
            order: [['createdAt', 'ASC']]
          }
        ]
      });
    } catch (error: any) {
      console.error('Error getting ticket:', error);
      throw new Error(`Failed to get ticket: ${error.message}`);
    }
  }

  private generateInitialTags(category: string, subject: string): string[] {
    const tags = [category];
    
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('urgent') || subjectLower.includes('emergency')) {
      tags.push('urgent');
    }
    if (subjectLower.includes('bug') || subjectLower.includes('error')) {
      tags.push('bug');
    }
    if (subjectLower.includes('feature') || subjectLower.includes('request')) {
      tags.push('enhancement');
    }
    
    return tags;
  }
}

export default new SupportService();