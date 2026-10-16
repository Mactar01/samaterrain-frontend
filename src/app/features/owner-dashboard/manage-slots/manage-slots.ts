import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FieldService } from '../../../core/services/field.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { formatApiError } from '../../../core/utils/error-formatter';
import { forkJoin } from 'rxjs';

import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

interface WeekDay {
  date: string;      // YYYY-MM-DD
  shortName: string; // Lun, Mar...
  label: string;     // 01/09
  dayNum: string;    // 01
}

@Component({
  selector: 'app-manage-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, DarkModeToggleComponent],
  templateUrl: './manage-slots.html'
})
export class ManageSlotsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fieldService = inject(FieldService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  goBack() {
    window.history.back();
  }

  fieldId!: number;
  selectedDate: string = new Date().toISOString().split('T')[0];
  slots: any[] = [];
  slotsByDate: Record<string, any[]> = {};
  weekDays: WeekDay[] = [];
  weekOffset = 0;

  isLoading = false;
  isAdding = false;
  isBulkGenerating = false;
  showBulkModal = false;
  
  showBlockModal = false;
  isBlocking = false;
  selectedSlotToBlock: any = null;
  blockReason = 'Rénovation / Travaux';
  blockCustomReason = '';

  // Manual Reserve
  showManualReserveModal = false;
  isReserving = false;
  selectedSlotToReserve: any = null;
  manualReserve = {
    playerName: '',
    playerPhone: ''
  };

  successMsg = '';
  errorMsg = '';

  newSlot = { start_time: '18:00', end_time: '19:00' };

  bulk = {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    openTime: '08:00',
    closeTime: '22:00',
    durationMinutes: 60
  };

  // Promo
  showPromoModal = false;
  selectedSlotForPromo: any = null;
  promoData = {
    promo_label: 'Promo -20%',
    promo_price: null
  };

  // Block Range
  showBlockRangeModal = false;
  blockRangeData = {
    startTime: '08:00',
    endTime: '12:00',
    reason: 'Maintenance / Pluie'
  };

  viewMode: 'list' | 'calendar' = 'list';
  // De 08h00 à 02h00 du matin (19 heures)
  calendarHours = Array.from({length: 19}, (_, i) => ((i + 8) % 24).toString().padStart(2, '0'));

  get availableCount() { return this.slots.filter(s => s.status === 'available').length; }
  get reservedCount() { return this.slots.filter(s => s.status === 'reserved').length; }

  // Calendar Helpers
  getSlotTop(time: string): string {
    if (!time) return '0px';
    let [h, m] = time.split(':').map(Number);
    // Les créneaux de fin de nuit (00h, 01h, 02h, etc.) se placent après 23h
    if (h < 6) {
      h += 24;
    }
    const top = ((h - 8) * 60) + m;
    return `${Math.max(0, top)}px`;
  }

  getSlotHeight(start: string, end: string): string {
    if (!start || !end) return '60px';
    let [h1, m1] = start.split(':').map(Number);
    let [h2, m2] = end.split(':').map(Number);
    if (h1 < 6) h1 += 24;
    if (h2 < 6 || h2 === 0) h2 += 24;
    if (h2 < h1) h2 += 24;
    const dur = ((h2 - h1) * 60) + (m2 - m1);
    return `${Math.max(30, dur)}px`;
  }

  sortSlotsChronologically(slots: any[]): any[] {
    if (!slots) return [];
    return [...slots].sort((a, b) => {
      const getWeight = (time: string) => {
        if (!time) return 0;
        let [h, m] = time.split(':').map(Number);
        if (h < 6) h += 24;
        return h * 60 + m;
      };
      return getWeight(a.start_time) - getWeight(b.start_time);
    });
  }


  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.fieldId = Number(params.get('id'));
      this.buildWeek();
      this.refreshData();
      this.preloadWeek();
    });
  }

  buildWeek() {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();
    // Find Monday of current week + offset
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + this.weekOffset * 7);

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        date: iso,
        shortName: dayNames[d.getDay()],
        label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
        dayNum: String(d.getDate()).padStart(2, '0')
      };
    });
  }

  preloadWeek() {
    // Reset slotsByDate pour éviter d'afficher d'anciennes données
    this.slotsByDate = {};
    this.cdr.detectChanges();

    const requests = this.weekDays.map(d =>
      this.fieldService.getSlots(this.fieldId, d.date)
    );
    forkJoin(requests).subscribe(results => {
      results.forEach((slots: any[], i: number) => {
        this.slotsByDate[this.weekDays[i].date] = slots;
      });
      // Nouvelle référence pour déclencher la détection de changements
      this.slotsByDate = { ...this.slotsByDate };
      this.cdr.detectChanges();
    });
  }

  selectDay(date: string) {
    this.selectedDate = date;
    this.refreshData();
  }

  prevWeek() {
    this.weekOffset--;
    this.buildWeek();
    this.preloadWeek();
  }

  nextWeek() {
    this.weekOffset++;
    this.buildWeek();
    this.preloadWeek();
  }

  refreshData() {
    this.loadSlots();
    this.preloadWeek();
  }

  loadSlots() {
    this.isLoading = true;
    this.fieldService.getSlots(this.fieldId, this.selectedDate).subscribe({
      next: (data: any) => {
        const sorted = this.sortSlotsChronologically(data || []);
        this.slots = sorted;
        this.slotsByDate[this.selectedDate] = sorted;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  onDateChange() { this.refreshData(); }

  addSlot() {
    if (!this.newSlot.start_time || !this.newSlot.end_time) {
      this.confirmationService.toast("Veuillez renseigner l'heure de début et l'heure de fin.", 'warning');
      return;
    }
    if (this.newSlot.start_time === this.newSlot.end_time) {
      this.confirmationService.toast("L'heure de fin ne peut pas être identique à l'heure de début.", 'warning');
      return;
    }
    const isNightCrossing = this.newSlot.end_time === '00:00' || (this.newSlot.start_time >= '18:00' && this.newSlot.end_time <= '06:00');
    if (!isNightCrossing && this.newSlot.end_time < this.newSlot.start_time) {
      this.confirmationService.toast("L'heure de fin doit être postérieure à l'heure de début.", 'warning');
      return;
    }

    this.isAdding = true;
    const payload = {
      date: this.selectedDate,
      start_time: this.newSlot.start_time,
      end_time: this.newSlot.end_time,
      is_recurring: false
    };
    this.fieldService.createSlot(this.fieldId, payload).subscribe({
      next: () => {
        this.confirmationService.toast('Créneau créé avec succès !', 'success');
        this.isAdding = false;
        this.refreshData();
      },
      error: (err: any) => {
        this.confirmationService.error(formatApiError(err));
        this.isAdding = false;
      }
    });
  }

  async deleteSlot(slotId: number) {
    const confirmed = await this.confirmationService.confirm({
        title: 'Supprimer le créneau ?',
        text: 'Ce créneau sera retiré de la disponibilité.',
        confirmButtonText: 'Supprimer',
        confirmButtonColor: '#ef4444'
    });
    if (!confirmed) return;

    this.fieldService.deleteSlot(this.fieldId, slotId).subscribe({
      next: () => {
        this.confirmationService.toast("Créneau supprimé", "success");
        this.refreshData();
      },
      error: () => this.confirmationService.error("Impossible de supprimer ce créneau.")
    });
  }

  async deleteAllAvailable() {
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer tous les créneaux ?',
      text: `Vous allez supprimer les ${this.availableCount} créneaux disponibles de cette journée.`,
      confirmButtonText: 'Tout supprimer',
      confirmButtonColor: '#ef4444'
    });
    if (!confirmed) return;

    const deletions = this.slots
      .filter(s => s.status === 'available')
      .map(s => this.fieldService.deleteSlot(this.fieldId, s.id));
    forkJoin(deletions).subscribe(() => {
        this.confirmationService.toast("Créneaux supprimés", "success");
        this.refreshData();
    });
  }

  // === Promo Methods ===
  openPromoModal(slot: any) {
    this.selectedSlotForPromo = slot;
    this.promoData.promo_price = slot.price;
    this.showPromoModal = true;
  }

  closePromoModal() {
    this.showPromoModal = false;
    this.selectedSlotForPromo = null;
  }

  applyPromo() {
    if (!this.selectedSlotForPromo) return;
    this.fieldService.updateSlot(this.fieldId, this.selectedSlotForPromo.id, {
      promo_label: this.promoData.promo_label,
      promo_price: this.promoData.promo_price
    }).subscribe({
      next: () => {
        this.confirmationService.toast("Promo appliquée", "success");
        this.closePromoModal();
        this.refreshData();
      },
      error: () => this.confirmationService.error("Erreur lors de l'application de la promo")
    });
  }

  // === Block Range Methods ===
  openBlockRangeModal() {
    this.showBlockRangeModal = true;
  }

  closeBlockRangeModal() {
    this.showBlockRangeModal = false;
  }

  applyBlockRange() {
    const slotsToBlock = this.slots.filter(s => {
      if (s.status !== 'available') return false;
      const slotStart = s.start_time.substring(0, 5);
      if (this.blockRangeData.endTime === '00:00') {
        return slotStart >= this.blockRangeData.startTime;
      }
      return slotStart >= this.blockRangeData.startTime && 
             slotStart < this.blockRangeData.endTime;
    });

    if (slotsToBlock.length === 0) {
      this.confirmationService.toast("Aucun créneau libre dans cette plage.", "info");
      return;
    }

    const blockRequests = slotsToBlock.map(s => 
      this.fieldService.updateSlot(this.fieldId, s.id, {
        status: 'blocked',
        block_reason: this.blockRangeData.reason
      })
    );

    forkJoin(blockRequests).subscribe({
      next: () => {
        this.confirmationService.toast(`${slotsToBlock.length} créneaux bloqués.`, "success");
        this.closeBlockRangeModal();
        this.refreshData();
      },
      error: () => this.confirmationService.error("Erreur lors du blocage.")
    });
  }

  openBulkModal() {
    this.bulk.startDate = this.selectedDate;
    this.bulk.endDate = this.selectedDate;
    this.showBulkModal = true;
  }

  estimateSlots(): number {
    if (!this.bulk.startDate || !this.bulk.endDate || !this.bulk.openTime || !this.bulk.closeTime) return 0;
    const [oh, om] = this.bulk.openTime.split(':').map(Number);
    const [ch, cm] = this.bulk.closeTime.split(':').map(Number);
    let openTotal = (oh * 60) + om;
    let closeTotal = (ch * 60) + cm;
    if (closeTotal <= openTotal) {
      closeTotal += 24 * 60;
    }
    const totalMins = closeTotal - openTotal;
    if (totalMins <= 0) return 0;
    const slotsPerDay = Math.floor(totalMins / this.bulk.durationMinutes);
    const start = new Date(this.bulk.startDate);
    const end = new Date(this.bulk.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(0, days * slotsPerDay);
  }

  generateBulk() {
    this.isBulkGenerating = true;

    const payload = {
      start_date: this.bulk.startDate,
      end_date: this.bulk.endDate,
      start_time: this.bulk.openTime,
      end_time: this.bulk.closeTime,
      duration_minutes: this.bulk.durationMinutes
    };

    this.fieldService.bulkCreateSlots(this.fieldId, payload).subscribe({
      next: (res) => {
        this.isBulkGenerating = false;
        this.showBulkModal = false;
        this.confirmationService.toast(res.message || "Créneaux générés avec succès", "success");
        this.refreshData();
        this.preloadWeek();
      },
      error: (err) => {
        this.isBulkGenerating = false;
        this.confirmationService.error(formatApiError(err));
        this.refreshData();
      }
    });
  }

  formatDisplayDate(date: string): string {
    if (!date) return '';
    const [y, m, d] = date.split('-');
    const months = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
    return `${d} ${months[parseInt(m)-1]} ${y}`;
  }

  toggleSlotStatus(slot: any) {
    if (slot.status === 'reserved') return;
    
    // Si on veut débloquer, on le fait directement sans modal
    if (slot.status === 'blocked') {
      this.fieldService.updateSlot(this.fieldId, slot.id, { status: 'available' }).subscribe({
        next: () => {
          slot.status = 'available';
          slot.block_reason = null;
          this.confirmationService.toast('Créneau débloqué avec succès', 'success');
        },
        error: () => this.confirmationService.error("Erreur lors de la modification du statut.")
      });
    }
  }

  openBlockModal(slot: any) {
    this.selectedSlotToBlock = slot;
    this.blockReason = 'Rénovation / Travaux';
    this.blockCustomReason = '';
    this.showBlockModal = true;
  }

  confirmBlock() {
    this.isBlocking = true;
    const finalReason = this.blockReason === 'Autre' ? this.blockCustomReason : this.blockReason;
    
    this.fieldService.updateSlot(this.fieldId, this.selectedSlotToBlock.id, { 
      status: 'blocked',
      block_reason: finalReason
    }).subscribe({
      next: () => {
        this.selectedSlotToBlock.status = 'blocked';
        this.selectedSlotToBlock.block_reason = finalReason;
        this.isBlocking = false;
        this.showBlockModal = false;
        this.confirmationService.toast('Créneau bloqué avec succès', 'success');
      },
      error: () => {
        this.isBlocking = false;
        this.confirmationService.error("Erreur lors du blocage.");
      }
    });
  }

  openManualReserve(slot: any) {
    this.selectedSlotToReserve = slot;
    this.manualReserve = { playerName: '', playerPhone: '' };
    this.showManualReserveModal = true;
  }

  confirmManualReserve() {
    if (!this.manualReserve.playerName || !this.manualReserve.playerPhone) {
      this.confirmationService.toast('Veuillez renseigner le nom et le numéro de téléphone', 'warning');
      return;
    }
    this.isReserving = true;
    const data = {
      time_slot_id: this.selectedSlotToReserve.id,
      player_name: this.manualReserve.playerName,
      player_phone: this.manualReserve.playerPhone
    };
    this.fieldService.createManualReservation(data).subscribe({
      next: (res) => {
        this.isReserving = false;
        this.showManualReserveModal = false;
        this.confirmationService.toast(res.message || 'Réservation confirmée avec succès !', 'success');
        this.refreshData();
      },
      error: (err) => {
        this.isReserving = false;
        this.confirmationService.error(formatApiError(err));
      }
    });
  }
}
