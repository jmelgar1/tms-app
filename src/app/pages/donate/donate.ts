import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { DonationService } from '../../services/donation.service';
import { DonationInfo } from '../../models/donation.model';

@Component({
  selector: 'app-donate',
  imports: [RouterLink, CurrencyPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './donate.html',
  styleUrl: './donate.scss',
})
export class Donate implements OnInit {
  private donationService = inject(DonationService);

  donationInfo = signal<DonationInfo | null>(null);

  stripeConfig = computed(() => ({
    publishableKey: this.donationInfo()?.stripe?.publishableKey || environment.stripe.publishableKey,
    buyButtonId: this.donationInfo()?.stripe?.buyButtonId || environment.stripe.buyButtonId,
  }));

  ngOnInit() {
    if (!document.querySelector('script[src*="buy-button.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/buy-button.js';
      script.async = true;
      document.head.appendChild(script);
    }

    this.donationService.getDonationInfo().subscribe({
      next: (info) => this.donationInfo.set(info),
    });
  }
}
