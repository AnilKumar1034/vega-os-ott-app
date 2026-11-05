import 'react-native';
import {render} from '@testing-library/react-native';
import * as React from 'react';
import {MenuIcon, MenuIconName} from '../src/components/atoms/MenuIcon';
import {colors} from '../src/theme/colors';

describe('MenuIcon component', () => {
  const iconNames: MenuIconName[] = [
    'Home',
    'Movies',
    'LiveTV',
    'MyList',
    'Details',
    'Settings',
    'Search',
    'Close',
  ];

  iconNames.forEach((name) => {
    it(`renders ${name} icon correctly according to its name`, () => {
      const screen = render(<MenuIcon name={name} />);
      const image = screen.getByTestId(`menu-icon-${name.toLowerCase()}`);
      expect(image).toBeTruthy();
      expect(image.props.source).toBeDefined();
    });
  });

  it('renders default icon when name is unknown', () => {
    const screen = render(<MenuIcon name="UnknownIcon" />);
    const image = screen.getByTestId('menu-icon-unknownicon');
    expect(image).toBeTruthy();
    expect(image.props.source).toBeDefined();
  });

  it('applies focused tint color when focused', () => {
    const screen = render(<MenuIcon name="Movies" focused={true} />);
    const image = screen.getByTestId('menu-icon-movies');
    const flatStyle = Object.assign({}, ...[image.props.style].flat());
    expect(flatStyle.tintColor).toBe(colors.focusedTint);
  });

  it('applies active tint color when active and not focused', () => {
    const screen = render(<MenuIcon name="LiveTV" active={true} focused={false} />);
    const image = screen.getByTestId('menu-icon-livetv');
    const flatStyle = Object.assign({}, ...[image.props.style].flat());
    expect(flatStyle.tintColor).toBe(colors.activeTint);
  });

  it('applies default textPrimary color when neither active nor focused', () => {
    const screen = render(<MenuIcon name="Settings" active={false} focused={false} />);
    const image = screen.getByTestId('menu-icon-settings');
    const flatStyle = Object.assign({}, ...[image.props.style].flat());
    expect(flatStyle.tintColor).toBe(colors.textPrimary);
  });
});
