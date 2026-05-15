import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Offer, OfferFilters, OfferStats } from '../types';
import { OffersService } from '../services/offers.service';

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats>({
    totalOffers: 0,
    draftOffers: 0,
    activeOffers: 0,
    acceptedOffers: 0,
    declinedOffers: 0,
    totalValue: 0,
    averageValue: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OfferFilters>({});

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const [offersData, statsData] = await Promise.all([
        OffersService.getOffers(filters),
        OffersService.getOfferStats()
      ]);
      setOffers(offersData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const sendOffer = async (offerId: string) => {
    try {
      await OffersService.sendOffer(offerId);
      toast.success('Offer sent successfully');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to send offer');
    }
  };

  const acceptOffer = async (offerId: string) => {
    try {
      await OffersService.updateOffer(offerId, { status: 'accepted' });
      toast.success('Offer accepted');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to accept offer');
    }
  };

  const declineOffer = async (offerId: string) => {
    try {
      await OffersService.updateOffer(offerId, { status: 'declined' });
      toast.success('Offer declined');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to decline offer');
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      await OffersService.deleteOffer(offerId);
      toast.success('Offer deleted successfully');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  const renewOffer = async (offerId: string) => {
    try {
      await OffersService.renewOffer(offerId);
      toast.success('Offer renewed successfully');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to renew offer');
    }
  };

  const convertOffer = async (offerId: string, data: { convertToSale: boolean; convertToServiceOrder: boolean }) => {
    try {
      const result = await OffersService.convertOffer({
        offerId,
        ...data
      });
      
      let message = 'Offer converted successfully';
      if (result.saleId && result.serviceOrderId) {
        message = `Offer converted to Sale (${result.saleId}) and Service Order (${result.serviceOrderId})`;
      } else if (result.saleId) {
        message = `Offer converted to Sale (${result.saleId})`;
      } else if (result.serviceOrderId) {
        message = `Offer converted to Service Order (${result.serviceOrderId})`;
      }
      
      toast.success(message);
      fetchOffers();
      return result;
    } catch (error) {
      toast.error('Failed to convert offer');
      throw error;
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [filters]);

  return {
    offers,
    stats,
    loading,
    filters,
    setFilters,
    sendOffer,
    acceptOffer,
    declineOffer,
    deleteOffer,
    renewOffer,
    convertOffer,
    refetch: fetchOffers
  };
}